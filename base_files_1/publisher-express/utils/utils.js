let { getConfig } = require("../model-manager/models.js");

module.exports.unlessRoute = function unlessRoute (path, middleware) {
    return function(req, res, next) {
        if (path.includes(req.url)) {
            return next();
        } else {
            return middleware(req, res, next);
        }
    };
};

module.exports.getRandomInt = function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.makeResNum = function makeResNum(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

module.exports.makeResNumByUser = async (user) => {
    let publisherId = (await getConfig('PublisherId')).value;
    return `Tr_${publisherId}_U_${user.id}_${user.credit}_${user.creditTransactions.length}`;
}

module.exports.makeResNumByWebsite = async (website, planId) => {
    let publisherId = (await getConfig('PublisherId')).value;
    return `Tr_${publisherId}_WP_${website.id}_${website.websitePlans.length}_${planId}`;
}

