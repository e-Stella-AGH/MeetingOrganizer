const {Guest} = require('../db/guest')
var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  console.log(Guest)
  const result = Guest.findAll()
  res.send(result);  
});

module.exports = router;
