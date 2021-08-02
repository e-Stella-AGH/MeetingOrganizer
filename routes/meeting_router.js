const {meetingService} = require("../services/meeting_service")
const express = require('express');
const router = express.Router();

router.get('/:uuid', function(req, res, next) {
  const uuid = req.params.uuid
  meetingService.getTimeSlotsIntersection(uuid)
      .then(result => res.status(result.status).send(result))
});
router.put('/:uuid/pick_time_slot', function(req, res, next) {
  const uuid = req.params.uuid
  const parsed = req.body
  meetingService.pickTimeSlot(uuid, parsed)
      .then(result => res.status(result.status).send(result))
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