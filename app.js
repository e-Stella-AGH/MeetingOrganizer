var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var guestRouter = require('./routes/guest_controller');
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
    app.use('/users', guestRouter);
})

module.exports = app;


