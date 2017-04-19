var express = require('express');
var bodyParser= require('body-parser');
var DataBase = require("./functions/database-functions")

var app= express();

var port = process.env.PORT || 8080;
app.use(bodyParser.json());

var listen = app.listen(port);

require('./routes/routes')(app);

console.log('The app runs on port ' + port);
// The app only has access as defined in the Security Rules
// var db = admin.database();
// var ref = db.ref("/questions");
// ref.once("value", function(snapshot) {
//     console.log(snapshot.val());
// });