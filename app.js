const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const hostRouter = require('./routes/host_router');
const organizerRouter = require('./routes/organizer_router');
const meetingRouter = require('./routes/meeting_router');
const {sequelize} = require("./db/sequelizer")
const {models} = require("./db/relations")

const app = express();

const model = models
sequelize.sync().then(_ => {


    app.use(logger('prod'));
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


