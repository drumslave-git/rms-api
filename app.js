var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const pg = require('pg');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var componentsRouter = require('./routes/components');
var migrationRouter = require('./routes/migration');

var app = express();

//Database connection
app.use(function(req, res, next){
    let connectionString = process.env.DATABASE_URL;
    if(!connectionString) {
        connectionString = require('./pgcfg');
    }
    res.locals.connection = new pg.Client({
        connectionString: connectionString,
        ssl: !!(process.env.DATABASE_URL),
    });
    res.locals.connection.connect();
    next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/v1/components', componentsRouter);
app.use('/api/v1/migration', migrationRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
