let express = require('express');
let router = express.Router();
let checkOwnerShip = require('../utils/publisherUtils.js').checkOwnerShip;

router.get('/', function (req, res) {
    // return all user services
})

router.get('/:id', checkOwnerShip, function (req, res) {
    // return service by id
})

router.post('/', function (req, res) {
    // create new service
})

router.put('/:id', checkOwnerShip, function (req, res) {
    // update service
})

router.delete('/:id', checkOwnerShip, function (req, res) {
    // delete service
})

router.put('/start/:id', checkOwnerShip, function (req, res) {
    // start service
})

router.put('/stop/:id', checkOwnerShip, function (req, res) {
    // stop service
})

router.put('/acl/:id', checkOwnerShip, function (req, res) {
    // change access controll of service
})

module.exports = router;