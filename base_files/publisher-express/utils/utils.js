import { getConfig } from "../models/config";

export function unlessRoute (path, middleware) {
    return function(req, res, next) {
        if (path.includes(req.baseUrl)) {
            return next();
        } else {
            return middleware(req, res, next);
        }
    };
};

export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function makeResNum(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export let makeResNumByUser = async (user) => {
    let publisherId = await getConfig('PublisherId');
    return `Tr_${publisherId}_U_${user.id}_${user.credit}_${user.creditTransactions.length}`;
}

export let makeResNumByWebsite = async (website, planId) => {
    let publisherId = await getConfig('PublisherId');
    return `Tr_${publisherId}_WP_${website.id}_${website.websitePlans.length}_${planId}`;
}

