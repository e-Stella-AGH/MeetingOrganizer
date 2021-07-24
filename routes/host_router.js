const {Organizer} = require('../db/organizer')
var express = require('express');
var router = express.Router();

// TOMEK
router.get('/<UUID_host>', function(req, res, next) {
  res.send("get host with his/her timeslots");  
});
router.put('/<UUID_host>', function(req, res, next) {
  res.send("update host's timeslots");  
});

module.exports = router;