
var scheduler = require('node-schedule');

var express  = require('express');
var app = express();
var mongoose =  require('mongoose');
var bodyParser = require('body-parser');
var methodOverride  = require('method-override');
var path = require('path');



require('rootpath')();
require('dotenv').config({path: __dirname + '/.env'});
// require('dotenv').config();

var env_config = require('server/config/development');
var admin = require('server/app/controllers/admin.controller');
admin.createsocket();


var port = process.env.PORT || 3000;

mongoose.connect(env_config.db);
console.log("---->Database connected successfully..." + env_config.db);


var montlyJob = scheduler.scheduleJob('0 0 1 * *', function(){
	admin.admin_schedule();
});

var dailyJob_rule = scheduler.scheduleJob('0 0 0 * * *', function(){
	admin.force_checkout();
});

// var dailyJob_rule = new scheduler.RecurrenceRule();
// dailyJob_rule.hour = 0;
// dailyJob_rule.minute = 0;
// dailyJob_rule.
// dailyJob_rule.dayOfWeek = new scheduler.Range(0,6)
// var dailyJob = scheduler.scheduleJob(dailyJob_rule, function(){
// 	admin.force_checkout();
// });


app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Headers", "Content-Type");
	res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
	next();
});

app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded

app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
app.use(express.static(__dirname + '/client')); // set the static files location /public/img will be /img for users

app.use('/image', express.static(path.join(__dirname + '/server/assets/image/upload')));
app.use('/pdf', express.static(path.join(__dirname + '/server/assets/pdf')));
app.use('/customerInfo', express.static(path.join(__dirname + '/server/assets/customerInfo')));


// routes ==================================================
require('router')(app); // pass our application into our routes

// route to handle all angular requests

// app.get('*', function (req, res) {
// 	res.sendfile('client/src/index.html');
// });

// start app ===============================================
app.listen(port);	
console.log('Connected to node at ' + port); 			// shoutout to the user

module.exports = app; 						// expose app
