var sendFunction= require('../functions/send-message');
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
}
