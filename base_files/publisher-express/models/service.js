const Service = (sequelize, DataTypes) => {
    const Service = sequelize.define('service', {
        id: {
            type: DataTypes.BIGINT,
            unique: true,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING
        },
        serverIpAddress: {
            type: DataTypes.STRING
        },
        url: {
            type: DataTypes.STRING
        },
        metadata: {
            type: DataTypes.JSON
        },
        mode: {
            type: DataTypes.ENUM,
            values: ['private', 'public']
        }
    });
     
    return Service;
};

module.exports = Service;