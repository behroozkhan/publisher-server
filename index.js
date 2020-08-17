require('dotenv').config();
let Response = require('./utils/response.js');

/// Configing publisher server nginx for browse publisher clients and call their apis
// TODO uncomment lines below to initial a publisher server if nginx not configed before
// let {initServerNginxConfig} = require('./serverInit.js');
// (async () => {
//     let result = await initServerNginxConfig(process.env.PUBLISHER_DOMAIN);

//     if (!result.success) {
//         console.log(`Can't set nginx config, error: ${result.error}`);
//         process.exit(1);
//     } elsse {
//         console.log('Initializing server complete');
//     }
// })();
/// Configing publisher server nginx for browse publisher clients and call their apis

let express = require('express');
const { start, update } = require('./publiser-worker-tools.js');
let app = express();
app.use(express.json());
const appBaseRoute = '/worker';

app.post(appBaseRoute + '/start', async function (req, res) {
    console.log("/start", "called");
    await start(req, res);
})

app.post(appBaseRoute + '/stop', async function (req, res) {
    // TODO stop a publisher server
    // TODO 1. set nginx to return custom html file for publisher server
})

app.post(appBaseRoute + '/update', async function (req, res) {
    await update(req, res);
})

app.post(appBaseRoute + '/remove', async function (req, res) {
    // TODO remove a publisher server
})

app.post(appBaseRoute + '/setdomain', async function (req, res) {
    // TODO set domain for exist publisher server
})

app.post(appBaseRoute + '/removedomain', async function (req, res) {
    // TODO remove domain for exist publisher server
})

app.get(appBaseRoute + '/resourceusage', async function (req, res) {
    // TODO return resource useage
})

app.get(appBaseRoute + '/test', function (req, res) {
    res.json(
        new Response(true, {}, 
            "Tested Successfully"
        ).json()
    );
})

app.listen(process.env.PORT, () => {
    console.log(`publisher worker listening on port ${process.env.PORT}!`);
});