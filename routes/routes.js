var sendFunction= require('../functions/send-message');
var DataBase= require('../functions/database-functions');
module.exports= function(app){
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
}
