let { getConfig } = require("../models/config");

let PublisherUtils = {};

PublisherUtils.getBackMoney = (oldPlan) => {
    if (!oldPlan)
        return 0;
        
    let totalDays =  moment.utc(oldPlan.boughtDate).diff(moment.utc(oldPlan.expireTime), 'days');
    let remainDays = moment.utc().diff(moment.utc(oldPlan.expireTime), 'days');

    if (remainDays < 0) remainDays = 0;
    
    let usingDays = totalDays - remainDays;

    let usingMoney = (usingDays / totalDays) * oldPlan.totalPriceOfPlan;
    let backMoney = oldPlan.totalPayForPlan - usingMoney;

    return Math.max(0, backMoney);
}

PublisherUtils.isUserNameUnique = (username) => {
    return models.User.count({ where: { username: username } })
      .then(count => {
        if (count != 0) {
          return false;
        }
        return true;
    });
}

PublisherUtils.isSubDomainUnique = (subDomain) => {
    if (!subDomain)
        return true;
    
    return models.Website.count({ where: { subDomain: subDomain } })
      .then(count => {
        if (count != 0) {
          return false;
        }
        return true;
    });
}

PublisherUtils.createOrUpgradeWebsiteInWeblancer = async (endUserId, endWebsiteId,
    resourcePlanId, permissionPlansId, planType, planOrder, metaData) => {

    let weblancerWebsiteCreateUrl = (await getConfig("WeblancerWebsiteCreateUrl")).value;

    return axios.post(`${weblancerWebsiteCreateUrl}`, {
        endUserId, endWebsiteId, resourcePlanId, permissionPlansId, planType, planOrder, metaData
    })
    .then(function (response) {
        res.json(
            response.data
        );
    })
    .catch(function (error) {
        res.status(500).json(
            error.response.data
        );
    });
}

PublisherUtils.checkOwnerShip = (req, res, next) => {
    let serviceId = req.param.id;
    // if user has service id => next(), else => reject()
}

module.exports = PublisherUtils;