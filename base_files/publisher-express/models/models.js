import Sequelize from 'sequelize';
 
const sequelize = new Sequelize(
    process.env.DATABASE,
    process.env.DATABASE_USER,
    process.env.DATABASE_PASSWORD,
    {
        dialect: 'postgres',
    },
);

const models = {
    User: sequelize.import('./user.js'),
    Plan: sequelize.import('./plan.js'),
    Website: sequelize.import('./website.js'),
    WebsitePlan: sequelize.import('./website-plan.js'),
    App: sequelize.import('./app.js'),
    Service: sequelize.import('./service.js'),
    Component: sequelize.import('./component.js'),
    Config: sequelize.import('./config.js'),
    CreditTransaction: sequelize.import('./credit-transaction.js'),
};

models.Website.hasOne(models.WebsitePlan);
models.WebsitePlan.hasOne(models.Plan);
models.User.hasMany(models.Website);
models.User.hasMany(models.App);
models.User.hasMany(models.Service);
models.User.hasMany(models.Component);
models.User.hasMany(models.CreditTransaction);

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

export { sequelize };
export { findAndCountAll };

export default models;