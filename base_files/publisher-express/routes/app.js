var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
    // return all user apps
})

router.get('/:id', checkOwnerShip, function (req, res) {
    // return app by id
})

router.post('/', function (req, res) {
    // create new app
})

router.put('/:id', checkOwnerShip, function (req, res) {
    // update app
})

router.delete('/:id', checkOwnerShip, function (req, res) {
    // delete app
})

router.put('/acl/:id', checkOwnerShip, function (req, res) {
    // change access controll of app
})

export function checkOwnerShip(req, res, next) {
    let appId = req.param.id;
    // if user has app id => next(), else => reject()
}

module.exports = router;