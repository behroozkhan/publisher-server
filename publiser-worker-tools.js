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
    let path = `${basePath}/Publisher_${publisherId}`;

    let newExpressPath = `${path}/publisher-express`;
    let newClientProjectPath = `${path}/publisher-client-project`;
    let clientGeneratedBuildPath = `${path}/publisher-client-project/build`;
    let newClientBuildPath = `${path}/build`;

    let dotEnvExpressPath = `${newExpressPath}/.env`;
    let clientConfigPath = `${newClientProjectPath}/src/Config/config.js`;

    let nginxSitesPath = process.env.NGINX_SITES_PATH;

    try {
        // TODO make it async in safe way
        if (!fs.existsSync(path)){
            fs.mkdirSync(path);
        }

        /// Express Configs
        await ncpAsync(expressPath, newExpressPath);

        let freePort = await getPort({port: getPort.makeRange(4000, 4999)});

        let data = await fsPromises.readFile(dotEnvExpressPath, 'utf8');
        let dbName = `PublisherDB_${publisherId}`;
        data = data
            .replace(/{dbName}/g, dbName)
            .replace(/{postgres_username}/g, process.env.POSTGRES_USER)
            .replace(/{postgres_password}/g, process.env.POSTGRES_PASSWORD)
            .replace(/{jwt_access_token_secret}/g, crypto.randomBytes(64).toString('hex'))
            .replace(/{port}/g, freePort)
            .replace(/{postgres_host}/g, postgresHost)
            .replace(/{hasCustomDomain}/g, hasPrivateDomain);

        fsPromises.writeFile(dotEnvExpressPath, data, 'utf8');

        let command = 'npm install';
        let installResult = await execP(command, {
            cwd: newExpressPath
        });
        
        console.log("Installing result", installResult, typeof installResult);
        if (installResult.status !== 0) {
            throw new Error ('Installing failed !!!');
        }

        // TODO can change with forever and pm2
        command = 'npm run start';
        let startResult = await execP(command, {
            cwd: newExpressPath
        });
        
        if (startResult.status !== 0) {
            throw new Error ('Running failed !!!');
        }
        /// Express Configs

        /// Client Configs
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
            .replace(/{BrandName}/g, publisherBrandName);

        fsPromises.writeFile(newDotEnv, data, 'utf8');

        command = 'npm run build';
        let buildResult = await execP(command, {
            cwd: newClientProjectPath
        });
        
        if (buildResult.status !== 0) {
            throw new Error ('Building client failed !!!');
        }

        await ncpAsync(clientGeneratedBuildPath, newClientBuildPath);
        await fsPromises.rename(`${path}/build`, `${path}/client`)
        /// Client Configs

        /// NginX Configs
        if (hasPrivateDomain) {
            data = await fsPromises.readFile(nginxConfPath, 'utf8');
            publisherDomains.forEach(async domainData => {
                data = data
                .replace(/{publisherId}/g, `Publisher_${publisherId}`)
                .replace(/{serverName}/g, `${domainData.root} ${domainData.subs.join(' ')}`)
                .replace(/{apiPort}/g, freePort);
    
                nginxSitesPath = `${nginxSitesPath}/${domainData.root}.conf`;
        
                fsPromises.writeFile(nginxSitesPath, data, 'utf8');
                
                command = `echo ${sudoPassword} | sudo -S nginx reload`;
        
                let nginxResult = await execP(command);
                
                if (nginxResult.status !== 0) {
                    throw new Error ('Nginx error !!!');
                }
            });
        }
        /// NginX Configs
        
        /// Database Configs
        dbTools.initDB(dbName, {
            user: process.env.POSTGRES_USER,
            host: postgresHost,
            database: 'WeblancerMain',
            password: process.env.POSTGRES_PASSWORD,
            port: 5432,
        })
        /// Database Configs

        res.status(404).json(
            new Response(true, {
                dataJsonPath: `${path}/public/data.json`,
                expressPort: freePort
            }).json()
        );
    } 
    catch (error) {
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