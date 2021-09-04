const { Authorize } = require('../services/jwt_service')
const { MeetingService } = require("../services/meeting_service")
var express = require('express');
var router = express.Router();


router.get('/', Authorize.authenticateToken, function (req, res) {
  MeetingService.getMeetings(req.user).then(result => res.send(result))
})
router.get('/:uuid', function (req, res, next) {
  const uuid = req.params.uuid
  MeetingService.getTimeSlotsIntersection(uuid)
    .then(result => res.status(result.status).send(result))
});
router.put('/:uuid/pick_time_slot', function (req, res, next) {
  const uuid = req.params.uuid
  const parsed = req.body
  MeetingService.pickTimeSlot(uuid, parsed)
    .then(result => res.status(result.status).send(result))
});

router.post('/', Authorize.authenticateToken, function (req, res) {
  const parsed = req.body
  MeetingService
    .createMeeting(parsed.uuid, parsed.hosts, parsed.guest, parsed.duration, req.user)
    .then(result => res.status(result.status).send(result))
});
router.put('/:meeting_uuid', Authorize.authenticateToken, Authorize.isMeetingOrganizer, function (req, res) {
  const parsed = req.body
  MeetingService
    .updateMeeting(req.meeting, parsed.hosts, parsed.guest, parsed.duration)
    .then(result => res.status(result.status).send(result))
});
router.delete('/:meeting_uuid', Authorize.authenticateToken, Authorize.isMeetingOrganizer, function (req, res, next) {
  const uuid = req.params.meeting_uuid
  MeetingService.deleteMeeting(uuid).then(response => res.status(200).send({ msg: "Meeting deleted" }))
});


module.exports = router;