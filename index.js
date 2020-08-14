require('dotenv').config();
const fsPromises = require('fs').promises;
var Promise = require("bluebird");
let ncpAsync = Promise.promisify(require('ncp').ncp);
let crypto = require('crypto');
let exec = require('child_process').exec;
let execP = Promise.promisify(exec);
const getPort = require('get-port');
let Response = require('./utils/response.js');

let express = require('express');
let app = express();

app.post('/start', async function (req, res) {
    // TODO start a publisher server
    // TODO 1. copy base weblancer landing page & publisher express to an appropriate folder
    // TODO 2. change configration files like style.css, index.html, webhookUrls, ...
    // TODO 3. set nginx to serve folder by some attributes like domainName, subDomain, ...
    // TODO 4. start publisher express with exec() and set port by findPort()...
    // TODO 5. set nginx to handle apis from /api/... to publisher express app 

    let {publisherId, publisherDomain, sudoPassword} = req.body;

    let expressPath = process.env.SOURCE_PUBLISHER_EXPRESS_APP;
    let clientPath = process.env.SOURCE_PUBLISHER_CLIENT;
    let nginxConfPath = process.env.SOURCE_NGINX_CONF;
    let basePath = process.env.PUBLISHER_EXPRESS_APP_BASE_PATH;
    let path = `${basePath}/${publisherId}`;

    let dotEnvPath = `${basePath}/${process.env.EXPRESS_DOTENV_PATH}`;

    let nginxSitesPath = process.env.NGINX_SITES_PATH;

    try {
        if (!await fsPromises.exists(path)) {
            await fsPromises.mkdir(path);
        }

        /// Express Configs
        await ncpAsync(expressPath, path);

        let freePort = await getPort({port: getPort.makeRange(4000, 4999)});

        let data = await fsPromises.readFile(dotEnvPath, 'utf8');
        let newDotEnv = data
            .replace(/{publisher_publisherId}/g, `PublisherDB_${publisherId}`)
            .replace(/{postgres_username}/g, process.env.POSTGRES_USER)
            .replace(/{postgres_password}/g, process.env.POSTGRES_PASSWORD)
            .replace(/{jwt_access_token_secret}/g, crypto.randomBytes(64).toString('hex'))
            .replace(/{port}/g, freePort);

        fsPromises.writeFile(dotEnvPath, newDotEnv, 'utf8');

        let command = 'npm install';
        let { status, stdout, stderr } = await execP(command, {
            cwd: path
        });
        
        if (status !== 0) {
            throw new Error ('Installing failed !!!');
        }

        command = 'npm run start';
        let startResult = await execP(command, {
            cwd: path
        });
        
        if (startResult.status !== 0) {
            throw new Error ('Running failed !!!');
        }
        /// Express Configs

        /// Client Configs
        await ncpAsync(clientPath, path);

        // TODO change client configs
        /// Client Configs

        /// NginX Configs
        let data = await fsPromises.readFile(nginxConfPath, 'utf8');
        let newNginxData = data
            .replace(/{publisherId}/g, `Publisher_${publisherId}`)
            .replace(/{serverName}/g, publisherDomain);

        let nginxSitesPath = `${nginxSitesPath}/${publisherDomain}.conf`;

        fsPromises.writeFile(nginxSitesPath, newNginxData, 'utf8');
        
        command = `echo ${sudoPassword} | sudo -S nginx reload`;

        let nginxResult = await execP(command);
        
        if (nginxResult.status !== 0) {
            throw new Error ('Nginx error !!!');
        }
        /// NginX Configs

        res.status(404).json(
            new Response(true, {dataJsonPath: `${path}/public/data.json`}).json()
        );
    } 
    catch (error) {
        res.status(404).json(
            new Response(false, {}, error.message).json()
        );
    } 
})

app.post('/stop', function (req, res) {
    // TODO stop a publisher server
    // TODO 1. set nginx to return custom html file for publisher server
})

app.post('/remove', function (req, res) {
    // TODO remove a publisher server
})

app.post('/setdomain', function (req, res) {
    // TODO set domain for exist publisher server
})

app.post('/removedomain', function (req, res) {
    // TODO remove domain for exist publisher server
})

app.get('/resourceusage', function (req, res) {
    // TODO return resource useage
})
 
app.listen(process.env.PORT, () => {
    console.log(`publisher worker listening on port ${process.env.PORT}!`);
});