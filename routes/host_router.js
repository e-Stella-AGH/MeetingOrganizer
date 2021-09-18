const { Organizer } = require('../db/organizer')
const express = require('express');
const { HostService } = require('../services/host_service')
const router = express.Router();

router.get('/:uuid', function (req, res, next) {
  const uuid = req.params.uuid
  HostService.getHostWithTimeSlots(uuid)
    .then(result => res.status(result.status).send(result))
});
router.put('/:uuid', HostService.hostExist, function (req, res, next) {
  const uuid = req.params.uuid
  const parsed = req.body
  console.log(parsed)
  HostService.updateHostsTimeSlots(uuid, parsed)
    .then(result => res.status(result.status).send(result))
});

module.exports = router;