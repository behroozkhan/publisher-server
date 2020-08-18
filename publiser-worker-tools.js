const fsPromises = require('fs').promises;
var Promise = require("bluebird");
let ncpAsync = Promise.promisify(require('ncp').ncp);
let crypto = require('crypto');
const exec = require('child_process').exec;
const { spawn } = require("child_process");
let execP = Promise.promisify(exec);
const getPort = require('get-port');
const dbTools = require('./dbTools.js');
let Response = require('./utils/response.js');
var fs = require("fs");
let dotenv = require('dotenv');
const cloneDeep = require('clone-deep');

function existsAsync(path) {
  return new Promise(function(resolve, reject){
    fs.exists(path, function(exists){
      resolve(exists);
    })
  })
}

function waitForMilis(milis) {
    return new Promise(function(resolve, reject){
        setTimeout(() => {
            resolve();
        }, milis);
    })
}

function execShellCommand(cmd, config) {
    return new Promise((resolve, reject) => {
        exec(cmd, config, (error, stdout, stderr) => {
            let success = !(error);
            resolve({success, stdout, stderr, error});
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
            console.log("Spawn Result: ", false, {stdout: out, stderr: err});
            resolved = true;
            resolve({success: false, stdout: out, stderr: err, error: error});
        });

        ls.on("close", code => {
            console.log("Spawn Result: ", true, {stdout: out, stderr: err});
            resolved = true;
            resolve({success: true, stdout: out, stderr: err});
        });

        setTimeout(() => {
            if (!resolved)
                resolve({success: true, stdout: out, stderr: err});
        }, 4000);

        if (unref)
            ls.unref();
    });
}

let start = async (req, res) => {
    let {publisherId, publisherDomains, sudoPassword, postgresHost,
        hasPrivateDomain, publisherBrandName, publisherVersion, expressPort,
        longProcessId, longProcessUrl} = req.body;

    let baseFilePath = `/base_files_${publisherVersion}`;
    
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
    let path = `${basePath}/publisher_${publisherId}`;

    let newExpressPath = `${path}/publisher-express`;
    let newClientProjectPath = `${path}/publisher-client-project`;
    let clientGeneratedBuildPath = `${path}/publisher-client-project/build`;
    let newClientBuildPath = `${path}/client`;

    let dotEnvExpressPath = `${newExpressPath}/.env`;
    let clientConfigPath = `${newClientProjectPath}/src/Config/config`;
    let clientPackagePath = `${newClientProjectPath}/package.json`;

    let nginxSitesPath = process.env.NGINX_SITES_PATH;

    res.json(
        new Response(true, {
            dataJsonPath: `${path}/public/data.json`,
            expressPort: freePort
        }).json()
    );
    
    try {
        // TODO make it async in safe way
        if (!fs.existsSync(path)){
            fs.mkdirSync(path);
        }
        console.log("Starting Publisher ...");
        updateLongProcess(longProcessUrl, longProcessId, 'Starting Publisher ...', 'running', {
            progress: 2
        });

        let dbName = `${
            publisherBrandName? publisherBrandName + '_': ''
        }PublisherDB_${publisherId}`;
        
        /// Database Configs
        console.log("Database Configs ...");
        updateLongProcess(longProcessUrl, longProcessId, 'Database Configs ...', 'running', {
            progress: 2
        });
        let initDbResult = await dbTools.initDB(dbName, {
            user: process.env.POSTGRES_USER,
            host: postgresHost,
            database: 'WeblancerMain',
            password: process.env.POSTGRES_PASSWORD,
            port: 5432,
        })

        if (!initDbResult.success) {
            console.log("Error: ", initDbResult.error);
            updateLongProcess(longProcessUrl, longProcessId, 'Database init failed !!!', 'failed', {error: initDbResult.error});
            throw new Error ('Database init failed !!!');
        }
        /// Database Configs

        /// Express Configs
        console.log("Express Configs ...");
        updateLongProcess(longProcessUrl, longProcessId, 'Express Configs ...', 'running', {
            progress: 8
        });
        await ncpAsync(expressPath, newExpressPath);
        await waitForMilis(1000);

        let freePort = await getPort({port: getPort.makeRange(4000, 4999)});

        let data = await fsPromises.readFile(dotEnvExpressPath, 'utf8');
        data = data
            .replace(/{dbName}/g, dbName)
            .replace(/{postgres_username}/g, process.env.POSTGRES_USER)
            .replace(/{postgres_password}/g, process.env.POSTGRES_PASSWORD)
            .replace(/{jwt_access_token_secret}/g, crypto.randomBytes(64).toString('hex'))
            .replace(/{port}/g, freePort)
            .replace(/{postgres_host}/g, postgresHost)
            .replace(/{hasCustomDomain}/g, hasPrivateDomain);

        let expressDotEnvObject = dotenv.parse(data);
        await fsPromises.writeFile(dotEnvExpressPath, data, 'utf8');

        console.log("Express Configs npm install ...");
        updateLongProcess(longProcessUrl, longProcessId, 'Express Configs npm install ...', 'running', {
            progress: 9
        });
        let command = 'npm install';
        let installResult = await execShellCommand(command, {
            cwd: newExpressPath,
            env: expressDotEnvObject
        });
        
        if (!installResult.success) {
            console.log("Error: ", installResult.error);
            updateLongProcess(longProcessUrl, longProcessId, 'Installing Express failed !!!', 'failed', {
                error: installResult.error
            });
            throw new Error ('Installing Express failed !!!');
        }

        // killing old express port
        if (expressPort) {
            command = `fuser -k ${expressPort}/tcp`;
            await execShellCommand(command);
        }

        let newEnv = cloneDeep(process.env);
        Object.keys(expressDotEnvObject).forEach(key => {
            newEnv[key] = expressDotEnvObject[key];
        });

        console.log(`Express Configs npm run start port ${freePort} ...`);
        updateLongProcess(longProcessUrl, longProcessId, 'Express Configs npm run start ...', 'running', {
            progress: 20
        });
        // TODO can change with forever or pm2
        command = 'npm';
        let startResult = await spawnAsync(command, ['run', 'start'], {
            cwd: newExpressPath,
            detached:true,
            env: newEnv
        }, true);
        
        if (!startResult.success) {
            console.log("Error: ",startResult.stdout, startResult.error);
            updateLongProcess(longProcessUrl, longProcessId, 'Running Express failed !!!', 'failed', {
                error: startResult.error
            });
            throw new Error ('Running Express failed !!!');
        }
        /// Express Configs

        /// Client Configs
        console.log("Client Configs ...");
        updateLongProcess(longProcessUrl, longProcessId, 'Client Configs ...', 'running', {
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
            .replace(/{AuthUrl}/g, baseApiUrl)
            .replace(/{ServerUrl}/g, baseApiUrl)
            .replace(/{BaseName}/g, `publisher_${publisherId}/client`)
            .replace(/{BrandName}/g, publisherBrandName);

        clientConfigPath += '.json';
        await fsPromises.writeFile(clientConfigPath, data, 'utf8');

        data = await fsPromises.readFile(clientPackagePath, 'utf8');
        data = data
            .replace(/{homepage}/g, `/publisher_${publisherId}/client`);
        await fsPromises.writeFile(clientPackagePath, data, 'utf8');
        
        console.log("Client Configs npm install ...");
        updateLongProcess(longProcessUrl, longProcessId, 'Client Configs npm install ...', 'running', {
            progress: 50
        });
        command = 'npm install';
        let installClientResult = await execShellCommand(command, {
            cwd: newClientProjectPath
        });
         
        if (!installClientResult.success) {
            console.log("Error: ", installClientResult.error);
            updateLongProcess(longProcessUrl, longProcessId, 'Installing client failed !!!', 'failed', {
                error: installClientResult.error
            });
            throw new Error ('Installing client failed !!!');
        }

        console.log("Client Configs npm run build ...");
        updateLongProcess(longProcessUrl, longProcessId, 'Client Configs npm run build ...', 'running', {
            progress: 70
        });
        command = 'npm run build';
        let buildResult = await execShellCommand(command, {
            cwd: newClientProjectPath
        });
        
        if (!buildResult.success) {
            console.log("Error: ", buildResult.error);
            updateLongProcess(longProcessUrl, longProcessId, 'Building client failed !!!', 'failed', {
                error: buildResult.error
            });
            throw new Error ('Building client failed !!!');
        }

        console.log("Client Configs copying builded files...");
        updateLongProcess(longProcessUrl, longProcessId, 'Client Configs copying builded files...', 'running', {
            progress: 90
        });
        await ncpAsync(clientGeneratedBuildPath, newClientBuildPath);
        await waitForMilis(1000);
        /// Client Configs

        /// NginX Configs
        if (hasPrivateDomain) {
            console.log("NginX Configs ...");
            updateLongProcess(longProcessUrl, longProcessId, 'NginX Configs ...', 'running', {
                progress: 95
            });
            data = await fsPromises.readFile(nginxConfPath, 'utf8');
            publisherDomains.forEach(async domainData => {
                data = data
                .replace(/{publisherId}/g, `publisher_${publisherId}`)
                .replace(/{serverName}/g, `${domainData.root} ${domainData.subs.join(' ')}`)
                .replace(/{apiPort}/g, freePort);
    
                nginxSitesPath = `${nginxSitesPath}/${domainData.root}.conf`;
        
                await fsPromises.writeFile(nginxSitesPath, data, 'utf8');
                
                command = `echo ${sudoPassword} | sudo -S nginx reload`;
        
                let nginxResult = await execShellCommand(command);
                
                if (!nginxResult.success) {
                    updateLongProcess(longProcessUrl, longProcessId, 'Nginx config error !!!', 'failed', {
                        error: nginxResult.error
                    });
                    throw new Error ('Nginx config error !!!');
                }
            });
        } else {
            console.log("No need to NginX Configs ...");
        }
        /// NginX Configs

        console.log("Finish, Publisher express and client configed successfully.");
        updateLongProcess(longProcessUrl, longProcessId, 'Finish, Publisher express and client configed successfully.',
            'complete', {expressPort: freePort, progress: 100});
    } 
    catch (error) {
        console.log("Configing Error", error);
        updateLongProcess(longProcessUrl, longProcessId, `Configing Error`, 'failed', {error: error});
    } 
};

function updateLongProcess(longProcessUrl, longProcessId, status, state, metaData) {
    let config = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    axios.post(longProcessUrl, {
        longProcessId, status, state, metaData
    }, config).then(res => {
    }).catch(error => {
        console.log("update long process error: ", error);
    })
};

let update = async (req, res) => {
    // TODO update a publisher express and database
    // TODO 1. pull publisher server from git
    // TODO 2. 
};

module.exports = {start};