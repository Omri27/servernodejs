/**
 * Created by Omri on 07/04/2017.
 */
var admin = require("firebase-admin");
var serviceAccount = require("../chatapp-d3713-firebase-adminsdk-mgk41-56a40c4550.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://chatapp-d3713.firebaseio.com"
});
var db = admin.database();


//public FeedListRequest(String title, String userId, String userName) {
exports.getHistoryRuns= function(userId,callback){
    var usersRef = db.ref("/users/"+userId+"/comingUpRuns");
    var historyRunRef = db.ref("/users/"+userId+"/historyRuns");
    var historyRuns = [];
    usersRef.once("value").then(function(snapshot) {
        if(snapshot.exists()) {
            snapshot.forEach(function (childSnapshot) {
                var key = childSnapshot.key;
                var childData = childSnapshot.val();
                var runsRef = db.ref("/runs/"+key);
                runsRef.once("value",function(snapshot) {
                   var run= snapshot.val()
                    var historyRun =insertToClass(run);
                   if(!snapshot.hasChild(key))
                    historyRunRef.child(key).set(historyRun);
                });
            });

        }
    });

};
function insertToClass(run){
    var historyClass ={date:run.date,time:run.time,creator:run.creator, location:run.location,distance:"",Preferences:run.preferences,maxRunners:"",marked:0,like:0};
    return historyClass;
}