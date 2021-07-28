const { Authorize } = require('../services/jwt_service')
const { organizerService } = require('../services/organizer_service')
const express = require('express');
const router = express.Router();

router.post("/register", function (req, res, next) {
    const body = req.body
    organizerService
        .register(body.email, body.password)
        .then(result => res.status(result.status).send(result))
})

router.post("/login", function (req, res, next) {
    const body = req.body
    organizerService
        .login(body.email, body.password)
        .then(result => res.status(result.status).send(result))
})

router.post("/test", Authorize.authenticateToken, function (req, res) {

    res.send("Correct token "+JSON.stringify(req.user))
})

module.exports = router;