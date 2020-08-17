require('dotenv').config();
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
const { start, update } = require('./publiser-worker-tools.js');
let app = express();
const appBaseRoute = '/worker';

app.post(appBaseRoute + '/start', async function (req, res) {
    await start(req, res);
})

app.post(appBaseRoute + '/stop', function (req, res) {
    // TODO stop a publisher server
    // TODO 1. set nginx to return custom html file for publisher server
})

app.post(appBaseRoute + '/update', function (req, res) {
    await update(req, res);
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