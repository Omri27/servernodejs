var FCM = require('fcm-node');
var serverKey= 'AAAA-qE8024:APA91bG_RcZxGAS9Af123NPw603B7K2YLQakeVf7iF_B-uj6QhmZiUq93-AIDFaRlc-aXkI_Rv25SfnfNkF9-DPpfXxryqsnSsOAKV4AVvwD2sUZgZC8ghk8z54XlUUAa96wuDwh_Nk0';
var fcm = new FCM(serverKey);
exports.sendMessage= function(message,title,registrationId,callback){
	
	
	var fcmMessage= {
		to: registrationId,
		data :{
			message: message,
			title: title
			}
	};
	

	fcm.send(fcmMessage,function(err,response){
		if(err){
			console.log('error: '+ err);
		}
		else{
			console.log('success '+ response);
		}
	});

};


