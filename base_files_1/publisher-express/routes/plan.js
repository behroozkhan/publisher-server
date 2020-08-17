var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
    // return all available plans
})

router.get('/:id', function (req, res) {
    // return plan by id
})

router.post('/', function (req, res) {
    // creat new plan
})

router.put('/', function (req, res) {
    // update plan
})

router.delete('/', function (req, res) {
    // delete plan
})

module.exports = router;