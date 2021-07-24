const {Organizer} = require('../db/organizer')
var express = require('express');
var router = express.Router();

router.get('/<UUID_meeting>', function(req, res, next) {
  res.send("Timeslots from hosts");  
});
router.put('/<UUID_meeting>/pick_time_slot', function(req, res, next) {
  res.send("choose timeslot");  
});
router.post('/', function(req, res, next) {
  res.send("create meeting");  
});
router.put('/<UUID_meeting>', function(req, res, next) {
  res.send("update meeting");  
});
router.delete('/<UUID_meeting>', function(req, res, next) {
  res.send("delete meeting");  
});


module.exports = router;