var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
    // return all user components
})

router.get('/:id', function (req, res) {
    // return component by id
})

router.post('/', function (req, res) {
    // create new component
})

router.put('/:id', checkOwnerShip, function (req, res) {
    // update component
})

router.delete('/:id', checkOwnerShip, function (req, res) {
    // delete component
})

router.put('/acl/:id', checkOwnerShip, function (req, res) {
    // change access controll of component
})

export function checkOwnerShip(req, res, next) {
    let componentId = req.param.id;
    // if user has component id => next(), else => reject()
}

module.exports = router;