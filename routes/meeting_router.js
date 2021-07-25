const {meetingService} = require("../services/meeting_service")
var express = require('express');
var router = express.Router();

// TOMEK
router.get('/<UUID_meeting>', function(req, res, next) {
  res.send("Timeslots from hosts");  
});
router.put('/<UUID_meeting>/pick_time_slot', function(req, res, next) {
  res.send("choose timeslot");  
});

router.post('/', function(req, res, next) {
  const parsed = req.body
  meetingService
    .createMeeting(parsed.uuid,parsed.hosts,parsed.guest,parsed.duration)
    .then(result => res.status(result.status).send(result))  
});
router.put('/:meeting_uuid', function(req, res, next) {
  const uuid = req.params.meeting_uuid
  const parsed = req.body
  meetingService
    .updateMeeting(uuid,parsed.hosts,parsed.guest,parsed.duration)
      .then(result => res.status(result.status).send(result))
});
router.delete('/:meeting_uuid', function(req, res, next) {
  const uuid = req.params.meeting_uuid
  meetingService.deleteMeeting(uuid).then( response => res.send({msg:"Meeting deleted"}))  
});


module.exports = router;