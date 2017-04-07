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

    var historyRuns = [];
    usersRef.once("value").then(function(snapshot) {
        if(snapshot.exists()) {
            snapshot.forEach(function (childSnapshot) {
                // key will be "ada" the first time and "alan" the second time
                var key = childSnapshot.key;
                // childData will be the actual contents of the child
                var childData = childSnapshot.val();
                var runsRef = db.ref("/runs/"+key);
                runsRef.once("value",function(snapshot) {
                    console.log(snapshot.val());
                    var jsonContent = JSON.parse(snapshot.val());
                    childSnapshot.push(

                    )
                });
            });
        }
    });


};
