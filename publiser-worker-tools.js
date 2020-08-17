const fsPromises = require('fs').promises;
var Promise = require("bluebird");
let ncpAsync = Promise.promisify(require('ncp').ncp);
let crypto = require('crypto');
let exec = require('child_process').exec;
let execP = Promise.promisify(exec);
const getPort = require('get-port');
const dbTools = require('./dbTools.js');
let Response = require('./utils/response.js');
var fs = require("fs");

function existsAsync(path) {
  return new Promise(function(resolve, reject){
    fs.exists(path, function(exists){
      resolve(exists);
    })
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

let start = async (req, res) => {
    // TODO start a publisher server
    // TODO 1. copy base weblancer landing page & publisher express to an appropriate folder
    // TODO 2. change configration files like style.css, index.html, webhookUrls, ...
    // TODO 3. set nginx to serve folder by some attributes like domainName, subDomain, ...
    // TODO 4. start publisher express with exec() and set port by findPort()...
    // TODO 5. set nginx to handle apis from /api/... to publisher express app 

    let {publisherId, publisherDomains, sudoPassword, postgresHost,
        hasPrivateDomain, publisherBrandName, publisherVersion} = req.body;

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
    let newClientBuildPath = `${path}/build`;

    let dotEnvExpressPath = `${newExpressPath}/.env`;
    let clientConfigPath = `${newClientProjectPath}/src/Config/config`;

    let nginxSitesPath = process.env.NGINX_SITES_PATH;

    try {
        // TODO make it async in safe way
        if (!fs.existsSync(path)){
            fs.mkdirSync(path);
        }
        console.log("Starting publisher");

        /// Express Configs
        console.log("Express Configs ...");
        await ncpAsync(expressPath, newExpressPath);

        let freePort = await getPort({port: getPort.makeRange(4000, 4999)});

        console.log("dotEnvExpressPath", dotEnvExpressPath)
        console.log("newExpressPath", newExpressPath)
        let data = await fsPromises.readFile(dotEnvExpressPath, 'utf8');
        let dbName = `${
            publisherBrandName? publisherBrandName + '_': ''
        }PublisherDB_${publisherId}`;
        data = data
            .replace(/{dbName}/g, dbName)
            .replace(/{postgres_username}/g, process.env.POSTGRES_USER)
            .replace(/{postgres_password}/g, process.env.POSTGRES_PASSWORD)
            .replace(/{jwt_access_token_secret}/g, crypto.randomBytes(64).toString('hex'))
            .replace(/{port}/g, freePort)
            .replace(/{postgres_host}/g, postgresHost)
            .replace(/{hasCustomDomain}/g, hasPrivateDomain);

        console.log("dotEnvData", data)
        await fsPromises.writeFile(dotEnvExpressPath, data, 'utf8');

        console.log("Express Configs npm install ...");
        let command = 'npm install';
        let installResult = await execShellCommand(command, {
            cwd: newExpressPath
        });
        
        if (!installResult.success) {
            console.log("Error: ", installResult.error);
            throw new Error ('Installing failed !!!');
        }

        // TODO can change with forever and pm2
        console.log(`Express Configs npm run start port ${freePort} ...`);
        command = 'npm run start';
        let startResult = await execShellCommand(command, {
            cwd: newExpressPath
        });
        
        if (!startResult.success) {
            console.log("Error: ",startResult.stdout, startResult.error);
            throw new Error ('Running failed !!!');
        }
        /// Express Configs

        /// Client Configs
        console.log("Client configs ...");
        await ncpAsync(clientPath, newClientProjectPath);

        data = await fsPromises.readFile(clientConfigPath, 'utf8');
        let baseApiUrl = `${
            !hasPrivateDomain ? 'publisherapi.' + process.env.PUBLISHER_DOMAIN + 
            '/api/' + freePort:
            publisherDomains[0].root + '/api'
        }`;

        data = data
            .replace(/{AuthUrl}/g, baseApiUrl)
            .replace(/{ServerUrl}/g, baseApiUrl)
            .replace(/{BaseName}/g, `publisher_${publisherId}/client`)
            .replace(/{BrandName}/g, publisherBrandName);

        clientConfigPath += '.json';
        await fsPromises.writeFile(clientConfigPath, data, 'utf8');
        
        console.log("Client configs npm install ...");
        command = 'npm install';
        let installClientResult = await execShellCommand(command, {
            cwd: newClientProjectPath
        });
         
        if (!installClientResult.success) {
            console.log("Error: ", installClientResult.error);
            throw new Error ('Installing client failed !!!');
        }

        console.log("Client configs npm run build ...");
        command = 'npm run build';
        let buildResult = await execShellCommand(command, {
            cwd: newClientProjectPath
        });
        
        if (!buildResult.success) {
            console.log("Error: ", buildResult.error);
            throw new Error ('Building client failed !!!');
        }

        console.log("Client configs copying builded files...");
        await ncpAsync(clientGeneratedBuildPath, newClientBuildPath);
        await fsPromises.rename(`${path}/build`, `${path}/client`)
        /// Client Configs

        /// NginX Configs
        if (hasPrivateDomain) {
            console.log("NginX Configs ...");
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
                    throw new Error ('Nginx error !!!');
                }
            });
        } else {
            console.log("No need to NginX Configs ...");
        }
        /// NginX Configs
        
        /// Database Configs
            console.log("Database Configs ...");
        let initDbResult = await dbTools.initDB(dbName, {
            user: process.env.POSTGRES_USER,
            host: postgresHost,
            database: 'WeblancerMain',
            password: process.env.POSTGRES_PASSWORD,
            port: 5432,
        })

        if (!initDbResult.success) {
            console.log("Error: ", initDbResult.error);
            throw new Error ('Database init failed !!!');
        }
        /// Database Configs

        console.log("Finish, Publisher express and client configed successfully.");
        res.json(
            new Response(true, {
                dataJsonPath: `${path}/public/data.json`,
                expressPort: freePort
            }).json()
        );
    } 
    catch (error) {
        console.log("Configing Error", error);
        res.status(404).json(
            new Response(false, {}, error.message).json()
        );
    } 
};

let update = async (req, res) => {
    // TODO update a publisher express and database
    // TODO 1. pull publisher server from git
    // TODO 2. 
};

module.exports = {start};