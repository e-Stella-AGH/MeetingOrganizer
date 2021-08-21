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

router.post("/login_integration", Authorize.getEmailFromIntegrationToken, function (req, res, next) {
    OrganizerService.loginWithEmail(req.userEmail).then(_result => res.send("Success"))
})

router.get("/", Authorize.authenticateToken, function (req, res, next) {
    res.send(req.user.email)
})

module.exports = router;