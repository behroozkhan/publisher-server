var express = require('express');
var router = express.Router();
let checkOwnerShip = require('../utils/publisherUtils.js').checkOwnerShip;

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

module.exports = router;