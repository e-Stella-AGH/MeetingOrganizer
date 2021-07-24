const {Organizer} = require('../db/organizer')
var express = require('express');
var router = express.Router();

// RADEK
router.post("/register", function(req, res, next) {
    res.send("register");  
})

router.post("/login", function(req, res, next) {
    res.send("login");  
})

module.exports = router;