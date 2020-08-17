let { sequelize } = require('./model-manager/models.js');
let { authorizeToken } = require('./acl/authorization.js');
let { unlessRoute } = require('./utils/utils.js');
let Response = require('./utils/response.js');

require('dotenv').config();

let express = require('express');
let app = express();
const appBaseRoute = '/api';
if (process.env.HAS_CUSTOM_DOMAIN) {
    appBaseRoute += `/${process.env.PORT}`
}

app.use(express.json());
app.use(unlessRoute([
    appBaseRoute + '/test', 
    appBaseRoute + '/', 
    appBaseRoute + '',
    appBaseRoute + '/user/login', 
    appBaseRoute + '/user/register'
], authorizeToken));

var appRoute = require('./routes/app.js');
var component = require('./routes/component.js');
var plan = require('./routes/plan.js');
var service = require('./routes/service.js');
var user = require('./routes/user.js');
var website = require('./routes/website.js');

app.use(appBaseRoute + '/app', appRoute);
app.use(appBaseRoute + '/component', component);
app.use(appBaseRoute + '/plan', plan);
app.use(appBaseRoute + '/service', service);
app.use(appBaseRoute + '/user', user);
app.use(appBaseRoute + '/website', website);

app.get(appBaseRoute + '/test', function (req, res) {
    res.json(
        new Response(true, {}, 
            "Tested Successfully"
        ).json()
    );
})

console.log(process.env.PORT);
sequelize.sync().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Publisher express server listening on port ${process.env.PORT}!`);
    });
});