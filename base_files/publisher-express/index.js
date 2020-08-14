import { sequelize } from './models';
import { checkPermissions } from './acl/publisher-acl';
import { authorizeToken } from './acl/authorization';
import { unlessRoute } from './utils/utils';

require('dotenv').config();

let express = require('express');
let app = express();

app.use(express.json());
app.use(unlessRoute(['/user/login', '/user/register'], authorizeToken));
app.use(unlessRoute(['/user/login', '/user/register'], checkPermissions));

var appRoute = require('./routes/app.js');
var component = require('./routes/component.js');
var plan = require('./routes/plan.js');
var service = require('./routes/service.js');
var user = require('./routes/user.js');
var website = require('./routes/website.js');

app.use('/app', appRoute);
app.use('/component', component);
app.use('/plan', plan);
app.use('/service', service);
app.use('/user', user);
app.use('/website', website);

sequelize.sync().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Publisher express server listening on port ${process.env.PORT}!`);
    });
});