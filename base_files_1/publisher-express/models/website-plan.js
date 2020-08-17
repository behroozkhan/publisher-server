const WebsitePlan = (sequelize, DataTypes) => {
    const WebsitePlan = sequelize.define('website_plan', {
        id: {
            type: DataTypes.BIGINT,
            unique: true,
            autoIncrement: true,
            primaryKey: true
        },
        boughtDate: {
            type: DataTypes.DATE,
        },
        expireTime: {
            type: DataTypes.DATE,
        },
        totalPriceOfPlan: {
            type: DataTypes.FLOAT,
        },
        totalPayForPlan: {
            type: DataTypes.FLOAT,
        },
        upgradedToUpperPlan: {
            type: DataTypes.BOOLEAN,
        },
        extended: {
            type: DataTypes.BOOLEAN,
        },
    });
     
    WebsitePlan.associate = function(models) {
        models.website.hasOne(models.website_plan);
        models.website_plan.hasOne(models.plan);
    };

    return WebsitePlan;
};

module.exports = WebsitePlan;