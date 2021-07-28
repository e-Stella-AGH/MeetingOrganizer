const { Authorize } = require('../services/jwt_service')
const { MeetingService } = require("../services/meeting_service")
var express = require('express');
var router = express.Router();

// TOMEK
router.get('/<UUID_meeting>', function (req, res, next) {
  res.send("Timeslots from hosts");
});
router.put('/<UUID_meeting>/pick_time_slot', function (req, res, next) {
  res.send("choose timeslot");
});

router.post('/',Authorize.authenticateToken, function (req, res) {
  const parsed = req.body
  MeetingService
    .createMeeting(parsed.uuid, parsed.hosts, parsed.guest, parsed.duration, req.user)
    .then(result => res.status(result.status).send(result))
});
router.put('/:meeting_uuid',Authorize.authenticateToken, Authorize.isMeetingOrganizer, function (req, res) {
  const parsed = req.body
  MeetingService
    .updateMeeting(req.meeting, parsed.hosts, parsed.guest, parsed.duration)
    .then(result => res.status(result.status).send(result))
});
router.delete('/:meeting_uuid',Authorize.authenticateToken, Authorize.isMeetingOrganizer, function (req, res, next) {
  const uuid = req.params.meeting_uuid
  MeetingService.deleteMeeting(uuid).then(response => res.send({ msg: "Meeting deleted" }))
});


module.exports = router;