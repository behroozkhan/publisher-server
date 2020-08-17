let {makeResNumByUser, makeResNumByPlanId} = require('../utils/utils.js');
let { getConfig } = require("../models/config.js");
let Response = require('../utils/response');
let {sequelize, models} = require('../model-manager/models');
let PublisherUtils = require('../utils/publisherUtils');

let express = require('express');
let router = express.Router();
let jwt = require('jsonwebtoken');

const axios = require('axios');

router.get('/', function (req, res) {
    // return all users
    findAndCountAll(req, res, models.User);
})

router.get('/:id', function (req, res) {
    // return user by id
    let id = req.params.id;
    models.User.find({
        where: {
           id: id
        }
    }).then(function(user) {
        if (!user) {
            res.status(404).json(
                new Response(false, {}, 
                    "User not found"
                ).json()
            );
            return;
        }

        res.json(
            new Response(true, {
                user
            }).json()
        );
    }).catch(error => {
        res.status(500).json(
            new Response(false, {}, error.message).json()
        );
    });
})

router.post('/', function (req, res) {
    // create new user
    let username = req.body.username;
    let password = req.body.password;

    models.User.create({
        username,
        password
    })
    .then(newUser => {
        res.json(
            new Response(true, {
                user: newUser
            }).json()
        );
    }).catch(error => {
        res.status(500).json(
            new Response(false, {}, error.message).json()
        );
    });
})

router.put('/:id',async function (req, res) {
    // update user
    let id = req.params.id;
    let user;
    try {
        user = await models.User.find({
            where: {
                id: id
            }
        });
    } catch {
        res.status(404).json(
            new Response(false, {}, "User not found").json()
        );
        return;
    }

    let firstName = req.body.firstName || user.firstName;
    let lastName = req.body.lastName || user.lastName;
    let nationalCode = req.body.nationalCode || user.nationalCode;
    let email = req.body.email || user.email;
    let mobile = req.body.mobile || user.mobile;

    user.update({
        firstName,
        lastName,
        nationalCode,
        email,
        email,
        mobile,
    })
    .success(result => {
        res.json(
            new Response(true, user).json()
        );
    })
})

router.delete('/:id', function (req, res) {
    // delete user
    // TODO comming soon
})

router.post('/paymentinit',async function (req, res) {
    // user want to charge credit
    let userId = req.user.id;
    let amount = req.body.amount;
    let gateway = req.body.gateway;
    let planId = req.body.planId;
    let websiteId = req.body.websiteId;
    
    let user;
    try {
        user = await models.User.find({
            where: {
                id: req.user.id
            },
            inculde: [models.CreditTransaction]
        });
    } catch {
        res.status(500).json(
            new Response(false, {}, "Can't get user").json()
        );
        return;
    }
    
    let website;
    try {
        website = await models.Website.find({
            where: {
                id: websiteId
            },
            inculde: [models.WebsitePlan]
        });
    } catch {
    }

    let resNum = (planId && website)? makeResNumByPlanId(website, planId): makeResNumByUser(user);

    let weblancerPaymentInitURL = (await getConfig('WeblancerPaymentInitURL')).value;
    let publisherId = (await getConfig('PublisherId')).value;
    
    if (!weblancerPaymentInitURL || !publisherId){
        onError(404, new Response(false, {}, "Can't get configs from db").json());
        return;
    }

    axios.post(`${weblancerPaymentInitURL}`, {
        publisherId, amount, gateway, resNum, endUserId: userId, 
        paymentData: {
            websiteId: websiteId,
            planId: planId
        }
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
})

router.post('/paymentverify',async function (req, res) {
    // user want to charge credit
    let paymentResponse = req.body.paymentResponse;

    let weblancerPaymentVerifyURL = (await getConfig('weblancerPaymentVerifyURL')).value;
    let publisherId = (await getConfig('PublisherId')).value;
    
    if (!weblancerPaymentInitURL || !publisherId){
        res.status(404).json(
            new Response(false, {}, "Can't get configs from db").json()
        );
        return;
    }

    axios.post(`${weblancerPaymentVerifyURL}`, {
        paymentResponse, publisherId
    })
    .then(async function (response) {
        let {paymentTransaction} = response.data.data;
        
        let transaction;
        try {
            // get transaction
            transaction = await sequelize.transaction();

            let creditTransaction = await models.CreditTransaction.create({
                amount: paymentTransaction.amount,
                useType: 'payment',
                description: paymentTransaction.initData.endUserId || publisher.id,
                resNum: paymentTransaction.resNum
            }, {transaction});

            let user;
            try {
                user = await models.User.find({
                    where: {
                        id: req.user.id
                    },
                    inculde: [models.CreditTransaction]
                });
            } catch {
                res.status(500).json(
                    new Response(false, {}, "Can't get user").json()
                );
                return;
            }

            user.credit += paymentTransaction.amount;
            user.creditTransactions.push(creditTransaction);

            await user.save({ fields: ['credit', 'creditTransactions'], transaction});

            await transaction.commit();

            res.json(new Response(true, {
                newCredit: user.credit,
                amount: paymentTransaction.amount,
                paymentTransaction
            }, paymentTransaction.message));
        } catch (error) {
            // Rollback transaction only if the transaction object is defined
            if (transaction) await transaction.rollback();
            
            res.status(500).json(
                new Response(false, {}, error.message).json()
            );
        }
    })
    .catch(function (error) {
        res.status(500).json(
            error.response.data
        );
    });
})

router.post('/login',async function (req, res) {
    // login user
    // check userName and password sent by user and authenticate him
    let user;
    try {
        user = await models.User.find({
            where: {
                username: req.body.username,
                password: req.body.password,
            },
            attributes: ['id', 'role']
        });
    } catch {
        res.status(401).json(
            new Response(false, {}, "Username or password is wrong").json()
        );
        return;
    }

    const accessToken = jwt.sign(user, process.env.JWT_ACCESS_TOKEN_SECRET);
    res.json(
        new Response(true, {accessToken: accessToken}).json()
    );
})

router.post('/register',async function (req, res) {
    // register user
    let username = req.body.username;
    let password = req.body.password;

    let isUnique = await PublisherUtils.isUserNameUnique(username);
    if (!isUnique) {
        res.status(409).json(
            new Response(false, {}, "Username is in use").json()
        );
    }
    
    try {
        await models.User.create({
            username,
            password
        });

        res.status(201).json(
            new Response(true, {}).json()
        );
    } catch {
        res.status(500).json(
            new Response(false, {}, "Username is in use").json()
        );
        return;
    }
})

module.exports = router;