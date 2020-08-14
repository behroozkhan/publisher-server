var express = require('express');
var router = express.Router();

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

export function checkOwnerShip(req, res, next) {
    let serviceId = req.param.id;
    // if user has service id => next(), else => reject()
}

module.exports = router;