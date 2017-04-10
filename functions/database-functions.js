/**
 * Created by Omri on 07/04/2017.
 */
var admin = require("firebase-admin");
var serviceAccount = require("../chatapp-d3713-firebase-adminsdk-mgk41-56a40c4550.json");
var dateFormat = require('dateformat');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://chatapp-d3713.firebaseio.com"
});
var db = admin.database();



exports.getHistoryRuns= function(userId,callback){
    var  nowDate = new Date();
    var usersRef = db.ref("/users/"+userId+"/comingUpRuns");
    var historyRunRef = db.ref("/users/"+userId+"/historyRuns");
    var historyRun =null;
    var childs =0;
    var i=0;
    var historyRuns= [];
    try {
      usersRef.once("value").then(function (snapshot) {

            if (snapshot.exists()) {
                childs = snapshot.numChildren();
                snapshot.forEach(function (childSnapshot) {
                    var key = childSnapshot.key;

                    //var childData = childSnapshot.val();
                    var runsRef = db.ref("/runs/" + key);
                    runsRef.once("value", function (snapshot) {
                        i++;
                        var run = snapshot.val()
                        historyRun = insertToClass(run);
                       // console.log(historyRun)
                        var olDate =stringToDateConvert(historyRun)
                        if (!snapshot.hasChild(key) && nowDate > olDate) {
                            historyRunRef.child(key).set(historyRun);
                            historyRuns.push({id:key});
                        }
                        if(i==childs){
                            console.log(historyRuns);
                            callback(historyRuns);
                        }
                    });
                });

            }
        });
    }catch (err){
        console.log(err.toString());
    }
}
exports.getRecommendedRuns= function(userId,location,callback){
    console.log(location);
   // var  nowDate = new Date();
   // var usersRef = db.ref("/users/"+userId+"/comingUpRuns");
    //var historyRunRef = db.ref("/users/"+userId+"/historyRuns");
    var object = [];
    object.push({id:12});
    callback(object);

};
function insertToClass(run){
   // console.log(run)
    var historyClass ={
        name:run.name,
        date:run.date,
        time:run.time,
        creator:run.creator,
        location:run.location,
        distance:"",
        Preferences:run.preferences,
        maxRunners:"",
        marked:false,
        like:false};
    return historyClass;
}
function stringToDateConvert(run){
    var parts = run.date.split("-");
    return new Date(parts[1]+"-"+ parts[0]+"-"+ parts[2]+" "+run.time);
}