const fsPromises = require('fs').promises;
var Promise = require("bluebird");
let ncpAsync = Promise.promisify(require('ncp').ncp);
let crypto = require('crypto');
const exec = require('child_process').exec;
const {
    spawn
} = require("child_process");
let execP = Promise.promisify(exec);
const getPort = require('get-port');
const dbTools = require('./dbTools.js');
let Response = require('./utils/response.js');
var fs = require("fs");
let dotenv = require('dotenv');
const cloneDeep = require('clone-deep');
let axios = require('axios');

function existsAsync(path) {
    return new Promise(function (resolve, reject) {
        fs.exists(path, function (exists) {
            resolve(exists);
        })
    })
}

function waitForMilis(milis) {
    return new Promise(function (resolve, reject) {
        setTimeout(() => {
            resolve();
        }, milis);
    })
}

function execShellCommand(cmd, config) {
    return new Promise((resolve, reject) => {
        exec(cmd, config, (error, stdout, stderr) => {
            let success = !(error);
            resolve({
                success,
                stdout,
                stderr,
                error
            });
        });
    });
}

function spawnAsync(cmd, args, options, unref) {
    return new Promise((resolve, reject) => {
        const ls = spawn(cmd, args, options);

        let resolved = false;
        let out = "";
        let err = "";
        ls.stdout.on('data', (data) => {
            out += data;
        });

        ls.stderr.on('data', (data) => {
            err += data;
        });

        ls.on('error', (error) => {
            resolved = true;
            resolve({
                success: false,
                stdout: out,
                stderr: err,
                error: error
            });
        });

        ls.on("close", code => {
            resolved = true;
            resolve({
                success: true,
                stdout: out,
                stderr: err
            });
        });

        setTimeout(() => {
            if (!resolved)
                resolve({
                    success: true,
                    stdout: out,
                    stderr: err
                });
        }, 4000);

        if (unref)
            ls.unref();
    });
}

let start = async (req, res) => {
    let {
        publisherId,
        publisherUserName,
        publisherPassword,
        publisherDomains,
        sudoPassword,
        postgresHost,
        hasPrivateDomain,
        publisherBrandName,
        publisherVersion,
        expressPort,
        longProcessId,
        longProcessUrl,
        longProcessToken
    } = req.body;

    let baseFilePath = `/base_files_${publisherVersion || 1}`;

    console.log("path: ", __dirname + baseFilePath)
    if (!await existsAsync(__dirname + baseFilePath)) {
        res.status(404).json(
            new Response(false, {}, `base_files version ${publisherVersion} not found in directory`).json()
        );
        return;
    }

    let expressPath = __dirname + baseFilePath + process.env.SOURCE_PUBLISHER_EXPRESS_APP;
    let clientPath = __dirname + baseFilePath + process.env.SOURCE_PUBLISHER_CLIENT;
    let nginxConfPath = __dirname + baseFilePath + process.env.SOURCE_NGINX_CONF;
    let basePath = process.env.PUBLISHER_EXPRESS_APP_BASE_PATH;
    let path = `${basePath}/${publisherUserName}`;

    let newExpressPath = `${path}/publisher-express`;
    let newClientProjectPath = `${path}/publisher-client-project`;
    let clientGeneratedBuildPath = `${path}/publisher-client-project/build`;
    let newClientBuildPath = `${path}/client`;

    let dotEnvExpressPath = `${newExpressPath}/.env`;
    let clientConfigPath = `${newClientProjectPath}/src/Config/config`;
    let clientPackagePath = `${newClientProjectPath}/package.json`;

    let nginxSitesPath = process.env.NGINX_SITES_PATH;

    res.json(
        new Response(true).json()
    );

    try {
        // TODO make it async in safe way
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
        console.log("Starting Publisher ...");
        updateLongProcess(longProcessUrl, longProcessToken,
            longProcessId, 'Starting Publisher ...', 'running', {
                progress: 2
            });

        let dbName = `PublisherDB_${publisherId}${
            publisherBrandName? '_' + publisherBrandName: ''
        }`;

        /// Database Configs
        console.log("Database Configs ...");
        updateLongProcess(longProcessUrl, longProcessToken,
            longProcessId, 'Database Configs ...', 'running', {
                progress: 2
            });
        let initDbResult = await dbTools.initDB(dbName, {
            user: process.env.POSTGRES_USER,
            host: postgresHost || "localhost",
            database: 'WeblancerMain',
            password: process.env.POSTGRES_PASSWORD,
            port: 5432,
        })

        if (!initDbResult.success) {
            console.log("Error: ", initDbResult.error);
            updateLongProcess(longProcessUrl, longProcessToken,
                longProcessId, 'Database init failed !!!', 'failed', {
                    error: initDbResult.error
                });
            throw new Error('Database init failed !!!');
        }
        /// Database Configs

        /// Express Configs

        // killing old express port
        if (expressPort) {
            // await execShellCommand(`fuser -k ${expressPort}/tcp`);
            // Kill pm2 process
            console.log("delete from pm2", publisherBrandName, "Publisher");
            await execShellCommand(`pm2 delete "${publisherBrandName} Publisher"`);
        }

        console.log("Express Configs ...");
        updateLongProcess(longProcessUrl, longProcessToken,
            longProcessId, 'Express Configs ...', 'running', {
                progress: 8
            });

            
        // await ncpAsync(expressPath, newExpressPath);
        await execShellCommand(`cp -r ${expressPath} ${newExpressPath}`);
        await waitForMilis(1000);

        let freePort = await getPort({
            port: getPort.makeRange(4000, 4999)
        });

        let data = await fsPromises.readFile(dotEnvExpressPath, 'utf8');
        data = data
            .replace(/{dbName}/g, dbName)
            .replace(/{postgres_username}/g, process.env.POSTGRES_USER)
            .replace(/{postgres_password}/g, process.env.POSTGRES_PASSWORD)
            .replace(/{jwt_access_token_secret}/g, crypto.randomBytes(64).toString('hex'))
            .replace(/{port}/g, freePort)
            .replace(/{postgres_host}/g, postgresHost || "localhost")
            .replace(/{publisherPassword}/g, publisherPassword)
            .replace(/{publisherId}/g, publisherId)
            .replace(/{hasCustomDomain}/g, hasPrivateDomain);

        let expressDotEnvObject = dotenv.parse(data);
        await fsPromises.writeFile(dotEnvExpressPath, data, 'utf8');

        console.log("Express Configs npm install ...");
        updateLongProcess(longProcessUrl, longProcessToken,
            longProcessId, 'Express Configs npm install ...', 'running', {
                progress: 9
            });
        let command = 'yarn install';
        let installResult = await execShellCommand(command, {
            cwd: newExpressPath,
            env: expressDotEnvObject
        });

        if (!installResult.success) {
            console.log("Error: ", installResult.error);
            updateLongProcess(longProcessUrl, longProcessToken,
                longProcessId, 'Installing Express failed !!!', 'failed', {
                    error: installResult.error
                });
            throw new Error('Installing Express failed !!!');
        }

        let newEnv = cloneDeep(process.env);
        Object.keys(expressDotEnvObject).forEach(key => {
            newEnv[key] = expressDotEnvObject[key];
        });

        console.log(`Express Configs npm run start port ${freePort} ...`);
        updateLongProcess(longProcessUrl, longProcessToken,
            longProcessId, 'Express Configs npm run start ...', 'running', {
                progress: 20
            });
        // TODO can change with forever or pm2
        command = 'npm';
        let startResult = await spawnAsync(command, ['run', 'start'], {
            cwd: newExpressPath,
            detached: true,
            env: newEnv
        }, true);

        if (!startResult.success) {
            console.log("Error: ", startResult.stdout, startResult.error);
            updateLongProcess(longProcessUrl, longProcessToken,
                longProcessId, 'Running Express failed !!!', 'failed', {
                    error: startResult.error
                });
            throw new Error('Running Express failed !!!');
        }
        /// Express Configs

        /// Client Configs
        console.log("Client Configs ...");
        updateLongProcess(longProcessUrl, longProcessToken,
            longProcessId, 'Client Configs ...', 'running', {
                progress: 40
            });
        await ncpAsync(clientPath, newClientProjectPath);
        await waitForMilis(1000);

        data = await fsPromises.readFile(clientConfigPath, 'utf8');
        let baseApiUrl = `${
            !hasPrivateDomain ? 'publisher.' + process.env.PUBLISHER_DOMAIN + 
            '/api':
            publisherDomains[0].root + '/api'
        }`;

        data = data
            .replace(/{BaseName}/g, `${publisherUserName}/client`)
            .replace(/{BrandName}/g, publisherBrandName)
            .replace(/{ExpressPort}/g, freePort);

        clientConfigPath += '.json';
        await fsPromises.writeFile(clientConfigPath, data, 'utf8');

        data = await fsPromises.readFile(clientPackagePath, 'utf8');
        data = data
            .replace(/{homepage}/g, `/${publisherUserName}/client`);
        await fsPromises.writeFile(clientPackagePath, data, 'utf8');

        console.log("Client Configs npm install ...");
        updateLongProcess(longProcessUrl, longProcessToken,
            longProcessId, 'Client Configs npm install ...', 'running', {
                progress: 50
            });
        command = 'yarn install';
        let installClientResult = await execShellCommand(command, {
            cwd: newClientProjectPath
        });

        if (!installClientResult.success) {
            console.log("Error: ", installClientResult.error);
            updateLongProcess(longProcessUrl, longProcessToken,
                longProcessId, 'Installing client failed !!!', 'failed', {
                    error: installClientResult.error
                });
            throw new Error('Installing client failed !!!');
        }

        console.log("Client Configs npm run build ...");
        updateLongProcess(longProcessUrl, longProcessToken,
            longProcessId, 'Client Configs npm run build ...', 'running', {
                progress: 70
            });
        command = 'yarn build';
        let buildResult = await execShellCommand(command, {
            cwd: newClientProjectPath
        });

        if (!buildResult.success) {
            console.log("Error: ", buildResult.error);
            updateLongProcess(longProcessUrl, longProcessToken,
                longProcessId, 'Building client failed !!!', 'failed', {
                    error: buildResult.error
                });
            throw new Error('Building client failed !!!');
        }

        console.log("Client Configs copying builded files...");
        updateLongProcess(longProcessUrl, longProcessToken,
            longProcessId, 'Client Configs copying builded files...', 'running', {
                progress: 90
            });
        await ncpAsync(clientGeneratedBuildPath, newClientBuildPath);
        await waitForMilis(1000);
        /// Client Configs

        /// NginX Configs
        if (hasPrivateDomain) {
            console.log("NginX Configs ...");
            updateLongProcess(longProcessUrl, longProcessToken,
                longProcessId, 'NginX Configs ...', 'running', {
                    progress: 95
                });
            data = await fsPromises.readFile(nginxConfPath, 'utf8');
            publisherDomains.forEach(async domainData => {
                data = data
                    .replace(/{publisherPath}/g, `${publisherUserName}`)
                    .replace(/{serverName}/g, `${domainData.root} ${domainData.subs.join(' ')}`)
                    .replace(/{apiPort}/g, freePort);

                nginxSitesPath = `${nginxSitesPath}/${domainData.root}.conf`;

                await fsPromises.writeFile(nginxSitesPath, data, 'utf8');

                command = `echo ${sudoPassword} | sudo -S nginx reload`;

                let nginxResult = await execShellCommand(command);

                if (!nginxResult.success) {
                    updateLongProcess(longProcessUrl, longProcessToken,
                        longProcessId, 'Nginx config error !!!', 'failed', {
                            error: nginxResult.error
                        });
                    throw new Error('Nginx config error !!!');
                }
            });
        } else {
            console.log("No need to NginX Configs ...");
        }
        /// NginX Configs

        console.log("Finish, Publisher express and client configed successfully.");
        updateLongProcess(longProcessUrl, longProcessToken,
            longProcessId, 'Finish, Publisher express and client configed successfully.',
            'complete', {
                expressPort: freePort,
                progress: 100
            });
    } catch (error) {
        console.log("Configing Error", error);
        updateLongProcess(longProcessUrl, longProcessToken,
            longProcessId, `Configing Error`, 'failed', {
                error: error
            });
    }
};

function updateLongProcess(longProcessUrl, longProcessToken, longProcessId, status, state, metaData) {
    let config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${longProcessToken}`
        }
    };

    axios({
        method: 'post',
        url: longProcessUrl,
        data: {
            longProcessId,
            status,
            state,
            metaData
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${longProcessToken}`
        }
    }).then(res => {}).catch(error => {
        console.log("update long process error: ", error);
    });
};

let update = async (req, res) => {
    // TODO update a publisher express and database
    // TODO 1. pull publisher server from git
    // TODO 2. 
};

module.exports = {
    start
};