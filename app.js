var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var hostRouter = require('./routes/host_router');
var organizerRouter = require('./routes/organizer_router');
var meetingRouter = require('./routes/meeting_router')
var {sequelize} = require("./db/sequelizer")
var {setRelations} = require("./db/relations")

var app = express();

setRelations()
sequelize.sync().then(_ => {


    app.use(logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    app.use('/', indexRouter);
    app.use('/organizer', organizerRouter);
    app.use('/meeting', meetingRouter);
    app.use('/host', hostRouter);
})

module.exports = app;


