import models from './models';

const Config = (sequelize, DataTypes) => {
    const Config = sequelize.define('Config', {
        id: {
            type: DataTypes.INTEGER,
            unique: true,
            autoIncrement: true,
            primaryKey: true
        },
        key: {
            type: DataTypes.STRING,
            unique: true,
        },
        value: {
            type: DataTypes.JSON,
        }
    });
     
    return Config;
};

export async function getConfig (key) {
    try {
        return await models.Config.find({
            where: {
                key: key
            }
        });
    } catch {
    }
}

export default Config;