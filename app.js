express = require('express');// make it global to access in all file
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var passport = require('passport');
var config = require('./config/database');
mongoose.connect(config.database);
var test = require('./routes/test');
var users = require('./routes/users');
var posts = require('./routes/posts');
var settings = require('./routes/settings');
var User = require("./models/userModel");
var app = express();


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// view engine setup
//app.set('view engine', 'jade');
process.env.SENDGRID_API_KEY = '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';
process.env.confirmBaseUrl = 'http://cmsbox.in/wordpress/phase';
process.env.rootUrl = 'http://67.205.173.26:3000';
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(passport.initialize());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));

app.use('/api/test', test);
app.use('/api/users', users);
app.use('/api/posts', posts);
app.use('/api/settings', settings);




app.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!'+err);
});

module.exports = app;
