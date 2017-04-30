/**
 * Created by Omri on 07/04/2017.
 */
var  geoLib = require('geo-lib');
var admin = require("firebase-admin");
var serviceAccount = require("../chatapp-d3713-firebase-adminsdk-mgk41-56a40c4550.json");
var dateFormat = require('dateformat');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://chatapp-d3713.firebaseio.com"
});
var db = admin.database();
// exports.updateAverage = function (userId,callback){
//     var historyRunRef = db.ref("/users/"+userId+"/historyRuns");
//     var HistoryGoodRuns = [];
//     var HistoryBadRuns = [];
//     var childs=0;
//     var i=0;
//     try {
//         historyRunRef.once("value").then(function (snapshot) {
//             if (snapshot.exists()) {
//                 childs = snapshot.numChildren();
//                 snapshot.forEach(function (childSnapshot) {
//
//                     var key = childSnapshot.key;
//                     var childData = childSnapshot.val();
//                     if(childData.marked == true && childData.like == true ) {
//                         HistoryGoodRuns.push(childData.Preferences);
//                     }
//                         if(childData.marked == true && childData.like == false ){
//                             HistoryBadRuns.push(childData.Preferences);
//                         }
//                     i++;
//                     if(i==childs){
//                         if(HistoryGoodRuns.length>0) {
//                             var goodRunsArray = averageCal(HistoryGoodRuns);
//                             var averageRef = db.ref("/users/" + userId + "/Average/GoodRuns");
//                             var numberOfGoodRef = db.ref("/users/" + userId + "/Average/NumberOfGood");
//                             averageRef.push(goodRunsArray);
//                             numberOfGoodRef.set(HistoryGoodRuns.length);
//                         }
//                         if(HistoryBadRuns.length>0) {
//                             var BadRunsArray = averageCal(HistoryBadRuns);
//                             averageRef = db.ref("/users/" + userId + "/Average/BadRuns");
//                             var numberOfBadRunsRef = db.ref("/users/" + userId + "/Average/NumberOfBad");
//                             averageRef.push(BadRunsArray);
//                             numberOfBadRunsRef.set(HistoryBadRuns.length);
//                         }
//                         var Response = {isOk : true};
//                         callback(Response);
//                     }
//                 });
//
//             }
//         });
//     }catch (err){
//         var Response = {isOk: false,err:err.toString()};
//         console.log(err.toString());
//         callback(Response);
//     }
// }
exports.updateAverage = function (userId,runId,callback){

    var runsRef = db.ref("/runs/"+runId+"/runners");
    var runAverageDetails = db.ref("/runs/"+runId);
    var idsArr = [];
    var childs=0;
    var details= [];
    var reads = [];
    var i=0;
    try {
        console.log("");
        runsRef.once("value").then(function (snapshot) {
            childs = snapshot.numChildren();
            snapshot.forEach(function (userId) {
                var usersRef = db.ref("/users/" + userId.key + "/Details");
                usersRef.once("value").then(function (userDetails) {
                    i++;
                    if (userDetails.val()!=null) {
                        details.push(userDetails.val())
                    }
                     if(i==childs){
                        if(details.length>0) {
                            var averageDetails = averageCalDetails(details);
                            runAverageDetails.child("DetailsAverage").set(averageDetails, function(){
                                var Response = {isOk: true, err: ""};
                                callback(Response);
                            });
                        }
                    }

                });

            });

        });

    }catch (err){
        var Response = {isOk: false,err:err.toString()};
        console.log(err.toString());
        callback(Response);
    }
}
function averageCalDetails(details) {
    var detailsProperty = [];
    for (var key in details[0]) {
        detailsProperty.push(key);
    }
    var averageDetails = [];
    for (var i = 0; i < detailsProperty.length; i++) {
        averageDetails[i] = 0;
        details.forEach(function (detail) {
            if (detailsProperty[i] == 'birthDate') {
                var date = stringToDate(detail[detailsProperty[i]])

                averageDetails[i] += _calculateAge(date);
            } else {
                averageDetails[i] += parseFloat(detail[detailsProperty[i]])

            }
        })

        averageDetails[i] = parseFloat(averageDetails[i]) / parseFloat(details.length);

    }
    var jsonDetail = convertToDetailObject();
    for (var i = 0; i < detailsProperty.length; i++) {
            jsonDetail[detailsProperty[i]] =averageDetails[i];
    }

return jsonDetail;
}
function convertToDetailObject(){
   var detailObject= {
       birthDate:"",
       gender:"",
       generalStatus:"",
       relationStatus:"",
       weight:""
   }
   return detailObject;
}
function _calculateAge(birthday) { // birthday is a date
    var ageDifMs = Date.now() - birthday.getTime();
    var ageDate = new Date(ageDifMs); // miliseconds from epoch

    return Math.abs(ageDate.getUTCFullYear() - 1970);
}
exports.getFeed = function (userId,deviceLongtitude,deviceLatitude,callback){
    var runs = db.ref("/runs");
    var  nowDate = new Date();
    var childs= 0;
    var i =0;
    try {
        var userFeed = db.ref("/users/" + userId + "/feedRuns");
        console.log("feed" + userId);
        runs.once("value").then(function (snapshot) {
            if (snapshot.exists()) {
                childs = snapshot.numChildren();
                snapshot.forEach(function (childSnapshot) {
                    var key = childSnapshot.key;
                    var runsRef = db.ref("/runs/" + key);
                    runsRef.once("value", function (snapshot) {
                        i++;
                        var run = snapshot.val()
                        var feedRun = insertToClass(false,userId, run);
                        var runDate = stringToDateConvert(feedRun)
                        if (nowDate < runDate) {
                            feedRun = calculateDistance(feedRun, deviceLongtitude, deviceLatitude);
                            userFeed.child(key).set(feedRun);
                        }
                        if (i == childs) {
                            var Response = {isOk: true, err:""};
                            callback(Response);
                        }
                    });

                });
            }
        });
    }catch(err){
        var Response = {isOk: false,err:err.toString()};
        console.log(err)
        callback(Response);
    }
}
function calculateDistance(run,longtitude,latitude){
    var runLongtitude = run.location.longtitude;
    var runLatitude = run.location.latitude;
    try {
        var result = geoLib.distance({
            p1: {lat: runLatitude, lon: runLongtitude},
            p2: {lat: latitude, lon: longtitude}
        });
        run.distanceFrom = result.distance;
        return run;
    }catch (err){
        console.log(err)
    }
}
function averageCal(Preferences) {
    try {
        console.log(Preferences[0]);
        var numOfQuestions = Preferences[0].length;
        var numOfRuns = Preferences.length;
        var array = new Array(Preferences[0].length);
        for (var j = 0; j < numOfQuestions; j++) {
            array[j] = 0;
            for (var i = 0; i < numOfRuns; i++) {
                console.log(Preferences[i][j].answer);
                array[j] += parseFloat(Preferences[i][j].answer);
            }
        }
        for (var j = 0; j < numOfQuestions; j++) {
            array[j] = array[j] / numOfRuns;
        }
        return array;
    }catch(err){
        console.log(err);
    }
}

exports.getHistoryRuns= function(userId,callback){
    var  nowDate = new Date();
    var usersUpcomingRunsRef = db.ref("/users/"+userId+"/feedRuns");
    var historyRunRef = db.ref("/users/"+userId+"/historyRuns");
    var historyRun =null;
    var childs =0;
    var i=0;
    console.log("asd");
    var historyRuns= [];
    try {
        usersUpcomingRunsRef.once("value").then(function (snapshot) {
            if (snapshot.exists()) {
                childs = snapshot.numChildren();
                if (childs > 0) {
                    snapshot.forEach(function (childSnapshot) {
                        var key = childSnapshot.key;
                        console.log(key)
                        var runsRef = db.ref("/users/"+userId+"/feedRuns/" + key);
                        runsRef.once("value", function (feedRun) {
                            i++;
                            var run = feedRun.val();
                            historyRun= insertToClass(false,userId,run);
                           // historyRun = insertToClass(run);
                            var olDate = stringToDateConvert(historyRun)
                            if (historyRun.sign && nowDate > olDate) {
                                historyRunRef.child(key).set(historyRun);
                                console.log("blabla");
                            }
                            if (i == childs) {
                                var Response = {isOk: true};
                                console.log(Response);
                                callback(Response);
                            }
                        });
                    });

                }
            }else{
                var Response = {isOk: true};
                callback(Response);
            }
        });
    }catch (err){
        var Response = {isOk: false,err:err.toString()};
        console.log(err)
        callback(Response);
    }
}
exports.getRecommendedRuns= function(userId,deviceLongtitude, deviceLatitude,callback) {
    var runs = db.ref("/runs");
    var userPreferences= db.ref("/users/"+userId+"/preferences");
    var  nowDate = new Date();
    var childs= 0;
    var i =0;
    try {
        var userFeed = db.ref("/users/" + userId + "/feedRuns");

        console.log("feed" + userId);
        userPreferences.once("value").then(function (userPreferences) {


            runs.once("value").then(function (snapshot) {
                if (snapshot.exists()) {
                    childs = snapshot.numChildren();
                    snapshot.forEach(function (childSnapshot) {
                        var key = childSnapshot.key;
                        var runsRef = db.ref("/runs/" + key);
                        runsRef.once("value", function (snapshot) {
                            i++;
                            var run = snapshot.val()
                            var feedRun = insertToClass(true, userId, run);
                            var runDate = stringToDateConvert(feedRun)
                            if (nowDate < runDate) {
                                feedRun = calculateDistance(feedRun, deviceLongtitude, deviceLatitude);
                                feedRun = getRunPropertiesMatch(feedRun, userPreferences.val());
                                userFeed.child(key).set(feedRun);
                            }
                            if (i == childs) {
                                var Response = {isOk: true, err: ""};
                                callback(Response);
                            }
                        });

                    });
                }
            });
        });
    }catch(err){
        var Response = {isOk: false,err:err.toString()};
        console.log(err)
        callback(Response);
    }

}
function getScore(averages,newrunPreferences,isGood,goodRuns, badRuns){


    var logSection = 0;
        if(isGood){

        }
}

function getRunPropertiesMatch(Run,userPreferences){
    var numOfQuestions = userPreferences.length;
    var sameAnswer = 0;
    if(userPreferences!=undefined){
        var runPreferences = Run.preferences

        for(var i=0; i<numOfQuestions;i++){
            if(runPreferences[i].answer ==userPreferences[i].answer ){
                sameAnswer++;
            }
        }
        Run.runPropertyMatch = sameAnswer/numOfQuestions*100;
    }
    return Run;
}
function getScoreNoRunRecord(userPreferences,newrunPreferences){

}
// function insertToClass(run){
//     var historyClass ={
//         name:run.name,
//         date:run.date,
//         time:run.time,
//         creator:run.creator,
//         location:{name: run.location.name, longtitude:run.location.longtitude, latitude:run.location.latitude},
//         distance:"",
//         preferences:run.preferences,
//         maxRunners:"",
//         marked:false,
//         like:false};
//     return historyClass;
// }
function insertToClass(isSmart, userId, run){
    try {
        var sign = false;
        if (run.runners != undefined) {
            var arr = [];
            for (var key in run.runners) {
                arr.push(key);
            }
            arr.forEach(function (id)
            {
                if (id == userId) {
                    sign = true;
                }
            });
        }
if(!isSmart) {
    var feedRun = {
        name: run.name,
        date: run.date,
        time: run.time,
        creator: run.creator,
        location: run.location,
        distance: "",
        sign: sign,
        preferences: run.preferences,
        maxRunners: "",
        runners: run.runners != undefined ? run.runners : null,
        //marked: false,
        //like: false,
        distanceFrom: 0
    };
    return feedRun;
}else{
    var smartRun = {
        name: run.name,
        date: run.date,
        time: run.time,
        creator: run.creator,
        location: run.location,
        distance: "",
        sign: sign,
        preferences: run.preferences,
        maxRunners: "",
        runners: run.runners != undefined ? run.runners : null,
       // marked: false,
        //like: false,
        distanceFrom: run.distanceFrom,
        runPropertyMatch:0,
        smartMatch:0
    };
    return smartRun;
}
    }catch(err){
        console.log(err)
    }
}
function stringToDateConvert(run){
    try {
        var parts = run.date.split("-");
        return new Date(parts[1] + "-" + parts[0] + "-" + parts[2] + " " + run.time);
    }
    catch(err){
        console.log(err)
    }
}
function stringToDate(date){
    try {
        var parts = date.split("-");
        return new Date(parts[1] + "-" + parts[0] + "-" + parts[2]);
    }
    catch(err){
        console.log(err)
    }
}