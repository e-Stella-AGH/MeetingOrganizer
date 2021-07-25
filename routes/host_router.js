const {Organizer} = require('../db/organizer')
var express = require('express');
const hostService = require('../services/host_service')
var router = express.Router();

router.get('/:uuid', function(req, res, next) {
  const result = hostService.getHostWithTimeSlots(req.params["uuid"])
  result.then(r => res.send(r))
});
router.put('/:uuid', function(req, res, next) {
  const result = hostService.updateHostsTimeSlots(req.params['uuid'], req.body)
  res.send("success")
  // result.then(r => {
  //   res.send("success")
  // })
});

router.post('/', function(req, res, next) {
  hostService.createHost().then(r => {
    res.send(r)
  })
});

module.exports = router;