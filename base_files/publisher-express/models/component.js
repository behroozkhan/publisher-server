const Component = (sequelize, DataTypes) => {
    const Component = sequelize.define('component', {
        id: {
            type: DataTypes.BIGINT,
            unique: true,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
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
     
    return Component;
};

module.exports = Component;