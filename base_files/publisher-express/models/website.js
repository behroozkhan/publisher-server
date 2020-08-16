const Website = (sequelize, DataTypes) => {
    const Website = sequelize.define('website', {
        id: {
            type: DataTypes.BIGINT,
            unique: true,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.STRING
        },
        subDomain: {
            type: DataTypes.STRING,
            unique: true,
        },
        serverIpAddress: {
            type: DataTypes.STRING
        },
        url: {
            type: DataTypes.STRING
        },
        metadata: {
            type: DataTypes.JSON
        }
    });
     
    return Website;
};

module.exports = Website;