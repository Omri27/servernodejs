var sendFunction= require('../functions/send-message');
var DataBase= require('../functions/database-functions');
var cors = require('cors')
module.exports= function(app){
    app.options('*', cors());
    app.use(function (req, res, next) {

        // Website you wish to allow to connect
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

        // Set to true if you need the website to include cookies in the requests sent
        // to the API (e.g. in case you use sessions)
        res.setHeader('Access-Control-Allow-Credentials', true);

        // Pass to next layer of middleware
        next();
    });
app.post('/send',function(req,res){
	var message= req.body.message;
	var registrationId= req.body.registrationId;
	var title = req.body.title;
	console.log(message + " " + registrationId + " " + title);
	sendFunction.sendMessage(message,title,registrationId, function(result){
		res.json(result);
	});	
    });
    app.post('/getHistoryRuns',function(req,res){
        var userId= req.body.userId;
        //console.log(userId);
        DataBase.getHistoryRuns(userId, function(result){
           res.json(result);
        });
    });

    app.post('/getRecommendedRuns',function(req,res){
        var userId= req.body.userId;
        var langlat = req.body.langlat;
        DataBase.getRecommendedRuns(userId,langlat, function(result){
            res.json(result);
        });
    });
    app.post('/updateAverage',function(req,res){
        var userId= req.body.userId;
        DataBase.updateAverage(userId, function(result){
            res.json(result);
        });
    });
    app.post('/getFeed',function(req,res){
        var userId= req.body.userId;
        var deviceLongtitude = req.body.langtitude;
        var deviceLatitude = req.body.latitude;
        DataBase.getFeed(userId,deviceLongtitude,deviceLatitude, function(result){
            res.json(result);
        });
    });
}
