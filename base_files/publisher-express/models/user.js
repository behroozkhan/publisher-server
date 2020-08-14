const User = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.BIGINT,
            unique: true,
            autoIncrement: true,
            primaryKey: true
        },
        username: {
            type: DataTypes.STRING,
            unique: true,
        },
        firstName: {
            type: DataTypes.STRING,
        },
        lastName: {
            type: DataTypes.STRING,
        },
        role: {
            type:   DataTypes.ENUM,
            values: ['weblancer', 'publisher', 'admin', 'user'],
            defaultValue: 'user'
        },
        nationalCode: {
            type: DataTypes.STRING,
        },
        mobile: {
            type: DataTypes.STRING,
        },
        email: {
            type: DataTypes.STRING,
        },
        password: {
            type: DataTypes.STRING,
        },
        credit: {
            type: DataTypes.INTEGER,
        },
        emailVerify: {
            type: DataTypes.BOOLEAN,
        },
        mobileVerify: {
            type: DataTypes.BOOLEAN,
        }
    });
     
    return User;
};

export default User;