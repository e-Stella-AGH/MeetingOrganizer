const {Organizer} = require('../db/organizer')
var express = require('express');
var router = express.Router();
const {meetingService} = require('../services/meeting_service')

//TOMEK
router.get('/:uuid', function(req, res, next) {
  res.send(meetingService.getTimeSlotsIntersection(req.params['uuid']));
});
router.put('/:uuid/pick_time_slot', function(req, res, next) {
  res.send("choose timeslot");  
});

//RADEK
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