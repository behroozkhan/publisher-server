require('dotenv').config();
const fsPromises = require('fs').promises;
var Promise = require("bluebird");
let ncpAsync = Promise.promisify(require('ncp').ncp);
let crypto = require('crypto');
let exec = require('child_process').exec;
let execP = Promise.promisify(exec);
const getPort = require('get-port');
const dbTools = require('./dbTools.js');
let Response = require('./utils/response.js');
let {initServerNginxConfig} = require('./serverInit.js');

/// Configing publisher server nginx for browse publisher clients and call their apis
(async () => {
    let result = await initServerNginxConfig(process.env.PUBLISHER_DOMAIN);

    if (!result.success) {
        console.log(`Can't set nginx config, error: ${error}`);
        process.exit(1);
    }
})();
/// Configing publisher server nginx for browse publisher clients and call their apis

let express = require('express');
let app = express();
const appBaseRoute = '/worker';

app.post(appBaseRoute + '/start', async function (req, res) {
    // TODO start a publisher server
    // TODO 1. copy base weblancer landing page & publisher express to an appropriate folder
    // TODO 2. change configration files like style.css, index.html, webhookUrls, ...
    // TODO 3. set nginx to serve folder by some attributes like domainName, subDomain, ...
    // TODO 4. start publisher express with exec() and set port by findPort()...
    // TODO 5. set nginx to handle apis from /api/... to publisher express app 

    let {publisherId, publisherDomains, sudoPassword, postgresHost,
        hasPrivateDomain, publisherBrandName, publisherVersion} = req.body;

    let baseFilePath = `/base_file_${publisherVersion}`;
    let expressPath = __dirname + baseFilePath + process.env.SOURCE_PUBLISHER_EXPRESS_APP;
    let clientPath = __dirname + baseFilePath + process.env.SOURCE_PUBLISHER_CLIENT;
    let nginxConfPath = __dirname + baseFilePath + process.env.SOURCE_NGINX_CONF;
    let basePath = process.env.PUBLISHER_EXPRESS_APP_BASE_PATH;
    let path = `${basePath}/${publisherId}`;

    let newExpressPath = `${path}/publisher-express`;
    let newClientProjectPath = `${path}/publisher-client-project`;
    let clientGeneratedBuildPath = `${path}/publisher-client-project/build`;

    let dotEnvExpressPath = `${newExpressPath}/.env`;
    let clientConfigPath = `${newClientProjectPath}/src/Config/config.js`;

    let nginxSitesPath = process.env.NGINX_SITES_PATH;

    try {
        if (!await fsPromises.exists(path)) {
            await fsPromises.mkdir(path);
        }

        /// Express Configs
        await ncpAsync(expressPath, path);

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

        fsPromises.writeFile(data, dotEnvExpressPath, 'utf8');

        let command = 'npm install';
        let { status, stdout, stderr } = await execP(command, {
            cwd: newExpressPath
        });
        
        if (status !== 0) {
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
        await ncpAsync(clientPath, path);

        let data = await fsPromises.readFile(clientConfigPath, 'utf8');
        let dbName = `PublisherDB_${publisherId}`;
        let baseApiUrl = `${
            !hasPrivateDomain ? 'publisherapi.' + process.env.PUBLISHER_DOMAIN + 
            '/api/' + freePort:
            publisherDomains[0].root + '/api'
        }`;

        data = data
            .replace(/{AuthUrl}/g, baseApiUrl)
            .replace(/{ServerUrl}/g, baseApiUrl)
            .replace(/{BrandName}/g, publisherBrandName);

        fsPromises.writeFile(data, newDotEnv, 'utf8');

        command = 'npm run build';
        let startResult = await execP(command, {
            cwd: newClientProjectPath
        });
        
        if (startResult.status !== 0) {
            throw new Error ('Building client failed !!!');
        }

        await ncpAsync(clientGeneratedBuildPath, path);
        await fsPromises.rename(`${path}/build`, `${path}/client`)
        /// Client Configs

        /// NginX Configs
        if (hasPrivateDomain) {
            let data = await fsPromises.readFile(nginxConfPath, 'utf8');
            publisherDomains.forEach(domainData => {
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
})

app.post(appBaseRoute + '/stop', function (req, res) {
    // TODO stop a publisher server
    // TODO 1. set nginx to return custom html file for publisher server
})

app.post(appBaseRoute + '/update', function (req, res) {
    // TODO update a publisher express and database
    // TODO 1. pull publisher server from git
    // TODO
})

app.post(appBaseRoute + '/remove', function (req, res) {
    // TODO remove a publisher server
})

app.post(appBaseRoute + '/setdomain', function (req, res) {
    // TODO set domain for exist publisher server
})

app.post(appBaseRoute + '/removedomain', function (req, res) {
    // TODO remove domain for exist publisher server
})

app.get(appBaseRoute + '/resourceusage', function (req, res) {
    // TODO return resource useage
})

app.listen(process.env.PORT, () => {
    console.log(`publisher worker listening on port ${process.env.PORT}!`);
});