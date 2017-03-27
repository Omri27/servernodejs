var express = require('express');
var bodyParser= require('body-parser');
var app= express();
var port = process.env.PORT || 8080;
app.use(bodyParser.json());

var listen = app.listen(port);

require('./routes/routes')(app);

console.log('The app runs on port ' + port);
