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

exports.updateAverage = function (userId,callback){
    var historyRunRef = db.ref("/users/"+userId+"/historyRuns");
    var HistoryGoodRuns = [];
    var HistoryBadRuns = [];
    var childs=0;
    var i=0;
    try {
        historyRunRef.once("value").then(function (snapshot) {
            if (snapshot.exists()) {
                childs = snapshot.numChildren();
                snapshot.forEach(function (childSnapshot) {

                    var key = childSnapshot.key;
                    var childData = childSnapshot.val();
                    if(childData.marked == true && childData.like == true ) {
                        HistoryGoodRuns.push(childData.Preferences);
                    }
                        if(childData.marked == true && childData.like == false ){
                            HistoryBadRuns.push(childData.Preferences);
                        }
                    i++;
                    if(i==childs){
                        if(HistoryGoodRuns.length>0) {
                            var goodRunsArray = averageCal(HistoryGoodRuns);
                            var averageRef = db.ref("/users/" + userId + "/Average/GoodRuns");
                            var numberOfGoodRef = db.ref("/users/" + userId + "/Average/NumberOfGood");
                            averageRef.push(goodRunsArray);
                            numberOfGoodRef.set(HistoryGoodRuns.length);
                        }
                        if(HistoryBadRuns.length>0) {
                            var BadRunsArray = averageCal(HistoryBadRuns);
                            averageRef = db.ref("/users/" + userId + "/Average/BadRuns");
                            var numberOfBadRunsRef = db.ref("/users/" + userId + "/Average/NumberOfBad");
                            averageRef.push(BadRunsArray);
                            numberOfBadRunsRef.set(HistoryBadRuns.length);
                        }
                        var Response = {isOk : true};
                        callback(Response);
                    }
                });

            }
        });
    }catch (err){
        console.log(err.toString());
    }
}
function averageCal(Preferences) {
    console.log(Preferences[0]);
    var numOfQuestions = Preferences[0].length;
    var numOfRuns = Preferences.length;
    var array = new Array(Preferences[0].length);
    for (var j = 0; j < numOfQuestions; j++) {
        array[j]=0;
        for (var i = 0; i < numOfRuns; i++) {
            console.log(Preferences[i][j].answer);
             array[j]+= parseFloat(Preferences[i][j].answer);
        }
    }
    for (var j = 0; j < numOfQuestions; j++) {
        array[j] =  array[j]/numOfRuns;
    }
    return array;

}
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
                        var olDate =stringToDateConvert(historyRun)
                        if (!snapshot.hasChild(key) && nowDate > olDate) {
                            historyRunRef.child(key).set(historyRun);
                            historyRuns.push({id:key});
                        }
                        if(i==childs){
                            var Response = {isOk : true};
                            callback(Response);
                        }
                    });
                });

            }
        });
    }catch (err){
        console.log(err.toString());
    }
}
exports.getRecommendedRuns= function(userId,location,callback) {
    var nowDate = new Date();
    var runs = [];
    var numGoodRun = 0;
    var numBadRun = 0;
    var goodScore = 0;
    var noHistoryScore = 0;
    var badScore = 0;
    var response = [];
    var childs = 0;
    var runsRef = db.ref("/runs");
     var userDataPreferencesRef = db.ref("/users/" + userId +"/Preferences");
    var historyRunAverageRef = db.ref("/users/" + userId + "/Average");
    var numberOfGoodRef = db.ref("/users/" + userId + "/Average/NumberOfGood");
    var numberOfBadRef = db.ref("/users/" + userId + "/Average/NumberOfBad");
    var historyGoodRunAverageRef = db.ref("/users/" + userId + "/Average/GoodRuns");
    var historyBadRunAverageRef = db.ref("/users/" + userId + "/Average/BadRuns");

    runsRef.once("value").then(function (runList) {
        if (runList.val() != null) {
            childs = runList.numChildren();
            numberOfGoodRef.once("value").then(function (NumGoodRun) {


                if (NumGoodRun.val() != null)
                    numGoodRun = NumGoodRun.val();
                numberOfBadRef.once("value").then(function (NumBadRun) {


                    if (NumBadRun.val() != null)
                        numBadRun = NumGoodRun.val();
                    runList.forEach(function (rawRun) {
                        if(numBadRun!=0 && numGoodRun!=0){

                        var run = insertToClass(rawRun.val());
                        var runDate = stringToDateConvert(run);
                        if (nowDate < runDate) {
                            historyGoodRunAverageRef.once("value").then(function (historyGoodAverage) {

                                if (historyGoodAverage.val() != null) {
                                    goodScore = getScore(historyGoodAverage.val(), run.Preferences, true, numGoodRun, numBadRun)
                                }
                                // historyBadRunAverageRef.once("value").then(function (historyBadAverage) {
                                //
                                //         if (historyBadAverage.val() != null) {
                                //             badScore = getScore(historyBadAverage.val(), run.Preferences, false, numGoodRun, numBadRun)
                                //         }
                                // });
                            });
                            historyBadRunAverageRef.once("value").then(function (historyBadAverage) {

                                if (historyBadAverage.val() != null) {
                                    badScore = getScore(historyBadAverage.val(), run.Preferences, false, numGoodRun, numBadRun)
                                }
                            });
                        }
                    }else{
                            userDataPreferencesRef.once("value").then(function(userPreferences){
                                if(userPreferences.val()!=null){
                                    noHistoryScore= getScoreNoRunRecord(userPreferences.val(),run.Preferences);
                                }
                            });
                        }
                    });
                });

            });



        }
        response.push();
        callback(response);
    });
}
function getScore(averages,newrunPreferences,isGood,goodRuns, badRuns){


    var logSection = 0;
        if(isGood){

        }
}
function getScoreNoRunRecord(userPreferences,newrunPreferences){

}
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