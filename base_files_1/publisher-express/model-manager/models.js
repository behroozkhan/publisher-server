let Sequelize = require('sequelize');
const User = require('../models/user');
const Plan = require('../models/plan');
const Website = require('../models/website');
const WebsitePlan = require('../models/website-plan');
const App = require('../models/app');
const Service = require('../models/service');
const Component = require('../models/component');
const Config = require('../models/config');
const CreditTransaction = require('../models/credit-transaction');
const {DataTypes} = Sequelize;
 
const sequelize = new Sequelize(
    process.env.DATABASE,
    process.env.DATABASE_USER,
    process.env.DATABASE_PASSWORD,
    {
        host: process.env.POSTGRES_HOST,
        dialect: 'postgres',
    },
);

const models = {
    User: User(sequelize, DataTypes),
    Plan: Plan(sequelize, DataTypes),
    Website: Website(sequelize, DataTypes),
    WebsitePlan: WebsitePlan(sequelize, DataTypes),
    App: App(sequelize, DataTypes),
    Service: Service(sequelize, DataTypes),
    Component: Component(sequelize, DataTypes),
    Config: Config(sequelize, DataTypes),
    CreditTransaction: CreditTransaction(sequelize, DataTypes),
};

let findAndCountAll = (req, res, model) => {
    let pageNumber = req.query.pageNumber || 1;
    let rowPerPage = req.query.rowPerPage || 10;
    let orderParam = req.query.orderParam || "createdAt";
    model.findAndCountAll({
        order: [[orderParam, 'DESC']],
        limit: pageNumber,
        offset: (pageNumber - 1) * rowPerPage,
    }).then(function (result) {
        res.json(
            new Response(true, {
                rows: result.rows, 
                count: result.count,
                pageNumber,
                rowPerPage,
                orderParam
            }).json()
        );
    }).catch(error => {
        res.status(500).json(
            new Response(false, {}, error.message).json()
        );
    });
}

module.exports.models = models;
module.exports.sequelize = sequelize;
module.exports.findAndCountAll = findAndCountAll;
module.exports.getConfig = async function getConfig (key) {
    try {
        let data = await models.Config.findOne({
            where: {
                key: key
            }
        });

        if (data) {
            return data.toJSON().value;
        } else {
            return {};
        }
    } catch (e) {
    }
}