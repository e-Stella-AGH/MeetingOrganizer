const { Authorize } = require('../services/jwt_service')
const { OrganizerService } = require('../services/organizer_service')
const express = require('express');
const router = express.Router();

router.post("/register", function (req, res, next) {
    const body = req.body
    OrganizerService
        .register(body.email, body.password)
        .then(result => res.status(result.status).send(result))
})

router.post("/login", function (req, res, next) {
    const body = req.body
    OrganizerService
        .login(body.email, body.password)
        .then(result => res.status(result.status).send(result))
})

router.put("/", Authorize.authenticateToken, function (req, res, next) {
    const body = req.body
    OrganizerService.updateOrganizer(req.user, body.password).then(elem => res.send(elem))
})

module.exports = router;