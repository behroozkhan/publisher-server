var express = require('express');
var router = express.Router();
let checkOwnerShip = require('../utils/publisherUtils.js').checkOwnerShip;

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

module.exports = router;