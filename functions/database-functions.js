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
exports.updateAverage = function (userId,runId,callback){
    var runsRef = db.ref("/runs/"+runId+"/runners");
    var runAverageDetails = db.ref("/runs/"+runId);
    var idsArr = [];
    var childs=0;
    var details= [];
    var reads = [];
    var i=0;
    try {
        runsRef.once("value").then(function (snapshot) {
            childs = snapshot.numChildren();
            if (childs > 0){
                snapshot.forEach(function (userId) {
                    var usersRef = db.ref("/users/" + userId.key + "/Details");
                    usersRef.once("value").then(function (userDetails) {
                        i++;
                        if (userDetails.val() != null) {
                            details.push(userDetails.val())
                        }
                        if (i == childs) {
                            if (details.length > 0) {
                                var averageDetails = averageCalDetails(details);
                                runAverageDetails.child("DetailsAverage").set(averageDetails, function () {
                                    var Response = {isOk: true, err: ""};
                                    callback(Response);
                                });
                            }
                        }

                    });

                });
        }else{
                runAverageDetails.child("DetailsAverage").remove(function(){
                    var Response = {isOk: true, err: ""};
                    callback(Response);
                })
            }
        });

    }catch (err){
        var Response = {isOk: false,err:err.toString()};
        console.log(err.toString());
        callback(Response);
    }
}
function averageCalDetails(details) {
    try {
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
            jsonDetail[detailsProperty[i]] = averageDetails[i];
        }

        return jsonDetail;
    }catch(err){
        console.log(err.toString())
    }
}
function convertToDetailObject(){
   var detailObject= {
       birthDate:"",
       height:"",
      // gender:"",
       //generalStatus:"",
       //relationStatus:"",
       weight:""
       // distance: ""
   }
   return detailObject;
}
function _calculateAge(birthday) { // birthday is a date
    try {
        var ageDifMs = Date.now() - birthday.getTime();
        var ageDate = new Date(ageDifMs); // miliseconds from epoch

        return Math.abs(ageDate.getUTCFullYear() - 1970);
    }catch(err){
        console.log(err.toString());
    }
}
exports.getFeed = function (userId,deviceLongtitude,deviceLatitude,callback){
    var runs = db.ref("/runs");
    var  nowDate = new Date();
    var childs= 0;
    var i =0;
    try {
        var userPref = db.ref("/users/" + userId + "/preferences");
        var userFeed = db.ref("/users/" + userId + "/feedRuns");
        userFeed.remove(function(){
        userPref.once("value").then(function (userPref){
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
                        var feedRun = insertToClass(false,userId, run,key);

                        var runDate = stringToDateConvert(feedRun)
                        if (nowDate < runDate) {
                            feedRun = calculateDistance(feedRun, deviceLongtitude, deviceLatitude);
                            feedRun = getRunPropertiesMatch(feedRun, userPref.val());
                            userFeed.child(key).set(feedRun);
                        }
                        if (i == childs) {
                            var Response = {isOk: true, err:""};
                            callback(Response);
                        }
                    });

                });
            }
            else{
                userFeed.remove(function() {
                    var Response = {isOk: true, err: ""};
                    callback(Response);
                });
            }
        })
        });
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
        //console.log( run.distanceFrom)
        return run;
    }catch (err){
        console.log(err)
    }
}
function averageCal(Preferences) {
    try {
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
    var userPref = db.ref("/users/" + userId + "/preferences");
    var usersUpcomingRunsRef = db.ref("/users/"+userId+"/comingUpRunsIds");
    var historyRunRef = db.ref("/users/"+userId+"/historyRuns");
    var historyRun =null;
    var childs =0;
    var i=0;
    console.log("asd");
    var historyRuns= [];
    try {
        historyRunRef.remove(function(){
        userPref.once("value").then(function(preferences){
        usersUpcomingRunsRef.once("value").then(function (snapshot) {

            //if (snapshot.exists()) {
                childs = snapshot.numChildren();
                 if (childs > 0) {
                    snapshot.forEach(function (childSnapshot) {
                        console.log(childSnapshot.val())
                        var key = childSnapshot.key;
                        console.log(key)
                        // var runsRef = db.ref("/users/"+userId+"/feedRuns/" + key);
                        var runsRef = db.ref("runs/"+ key);
                        runsRef.once("value", function (feedRun) {
                            i++;
                            var run = feedRun.val();
                            historyRun= insertToClass(false,userId,run,key);
                           // historyRun = insertToClass(run);
                            var olDate = stringToDateConvert(historyRun)
                            if (nowDate > olDate &&( historyRun.sign || historyRun.creatorId == userId )) {
                                historyRun = getRunPropertiesMatch(historyRun,preferences.val())
                                historyRunRef.child(key).set(historyRun);
                            }
                            if (i == childs) {
                                var Response = {isOk: true};
                               // console.log(Response);
                                callback(Response);
                            }
                        });
                    });

              //  }
            }else{
                var Response = {isOk: true};
                callback(Response);
            }
        });
        });
        });
    }catch (err){
        var Response = {isOk: false,err:err.toString()};
        console.log(err)
        callback(Response);
    }
}
exports.getComingUpRuns= function(userId,callback) {
    var runsRef = db.ref("/runs");
    var userPreferences= db.ref("/users/"+userId+"/preferences");
    var childs =0;
    var  nowDate = new Date();
    var i =0;
    var comingUpRuns =  db.ref("/users/"+userId+"/comingUpRuns");
    try {

        comingUpRuns.remove(function () {
            userPreferences.once("value").then(function(preferences){
            runsRef.once("value").then(function (runs) {
                if (runs.exists()) {
                    childs = runs.numChildren();

                    runs.forEach(function (childSnapshot) {
                        var key = childSnapshot.key;
                        runsRef.child(key).once("value").then(function (run) {
                            i++;
                            var comingUpRun = insertToClass(false, userId, run.val(), key);
                            var runDate = stringToDateConvert(comingUpRun)
                            if (nowDate < runDate && (comingUpRun.sign == true || comingUpRun.creatorId == userId)) {
                                comingUpRun = getRunPropertiesMatch(comingUpRun,preferences.val());
                                comingUpRuns.child(key).set(comingUpRun, function () {

                                })

                            }
                            if (i == childs) {
                                var Response = {isOk: true, err: ""};
                                callback(Response);
                            }
                        });
                    });
                } else {
                    var Response = {isOk: true, err: ""};
                    callback(Response);
                }
            });
        });
        });
    }catch(err){
        var Response = {isOk: false, err: err.toString()};
        callback(Response);
    }
}
exports.getRecommendedRuns= function(userId,deviceLongtitude, deviceLatitude,callback) {
    var runs = db.ref("/runs");
    var userPreferences= db.ref("/users/"+userId+"/preferences");
    var userDetaills= db.ref("/users/"+userId+"/Details");
    var userDistanceRadios= db.ref("/users/"+userId+"/radiosDistance");
    var smartRuns= db.ref("/users/"+userId+"/recommendedRuns");
    var  nowDate = new Date();
    var runsArray=[];
    var childs= 0;
    var i =0;
    try {
        var userFeed = db.ref("/users/" + userId + "/feedRuns");

        console.log(userId);
        userPreferences.once("value").then(function (userPreferences) {

            userDistanceRadios.once("value").then(function(radius){

                userDetaills.once("value").then(function(details){
                    smartRuns.remove(function () {


            runs.once("value").then(function (snapshot) {
                if (snapshot.exists()) {
                    childs = snapshot.numChildren();
                    snapshot.forEach(function (childSnapshot) {
                        var key = childSnapshot.key;
                        var runsRef = db.ref("/runs/" + key);
                        runsRef.once("value", function (snapshot) {
                            i++;
                            var run = snapshot.val()
                            var feedRun = insertToClass(true, userId, run,key);
                            var runDate = stringToDateConvert(feedRun)
                            feedRun = calculateDistance(feedRun, deviceLongtitude, deviceLatitude);
                            if (nowDate < runDate && radius.val() >= feedRun.distanceFrom ) {
                                feedRun = getRunPropertiesMatch(feedRun, userPreferences.val());
                                runsArray.push(feedRun);

                            }
                            if (i == childs) {
                                runsArray.sort(function (run1,run2){
                                    return run2.runPropertyMatch - run1.runPropertyMatch;
                                });

                                runsArray = calculateScore(details.val(),runsArray);
                                i=0;
                                runsArray.forEach(function(run){
                                    i++;
                                    smartRuns.child(run.id).set(run);
                                    if(i==runsArray.length){
                                        var Response = {isOk: true, err:""};
                                        callback(Response);
                                    }
                                })
                            }
                        });

                    });
                }else{
                    smartRuns.remove(function(){
                        var Response = {isOk: true, err:""};
                        callback(Response);
                    })

                }
            });
                });
            });
            });
        });
    }catch(err){
        var Response = {isOk: false,err:err.toString()};
        console.log(err)
        callback(Response);
    }

}
function calculateScore(userDetails,runs){
    runs.forEach(function (run){
        if(run.DetailsAverage!=undefined){
           // var variance =calVariance(userDetails,run.DetailsAverage);
            var variance =2;
            //console.log("variance "+ variance)
            run.smartMatch = calMahal(userDetails,run.DetailsAverage,variance)*0.4 +0.6*(100-run.runPropertyMatch);
           // console.log(run.smartMatch)
        }
    });
   //console.log(runs)
    return runs;
}
function calVariance(userDetails,runDetailAverage){
    try {
        var detailsProperty = [];
        for (var key in userDetails) {
            detailsProperty.push(key);
        }
        var numOfDeatils = detailsProperty.length;
        var sum = 0;
        for (var i = 0; i < numOfDeatils; i++) {
            if (detailsProperty[i] != "birthDate")
                sum += Math.pow(userDetails[detailsProperty[i]] - runDetailAverage[detailsProperty[i]], 2);
            else {
                var userAge = _calculateAge(stringToDate(userDetails[detailsProperty[i]]))
                sum += Math.pow(userAge - runDetailAverage[detailsProperty[i]], 2);
            }
        }
        console.log(sum / numOfDeatils)
        return sum / numOfDeatils;
    }catch(err){
        console.log(err.toString());
    }
}
function calMahal(userDetails,runDetailAverage,variance){
    try {
        var detailsProperty = [];
        for (var key in userDetails) {
            detailsProperty.push(key);
        }
        var numOfDeatils = detailsProperty.length;
        var sum = 0;
        for (var i = 0; i < numOfDeatils; i++) {
            if (variance > 0) {
                if (detailsProperty[i] != "birthDate") {
                    sum += Math.pow((userDetails[detailsProperty[i]] - runDetailAverage[detailsProperty[i]])/ variance, 2);
                } else {
                    var userAge = _calculateAge(stringToDate(userDetails[detailsProperty[i]]))
                    sum += Math.pow((userAge - runDetailAverage[detailsProperty[i]])/ variance, 2) ;
                }
            }
        }

        sum = Math.sqrt(sum);
        return sum;
    }catch(err){
        console.log(err.toString());
    }
}
function getRunPropertiesMatch(run,userPreferences){
try {
    var numOfQuestions = userPreferences.length;
    var sameAnswer = 0;
    if (userPreferences != undefined) {
        var runPreferences = run.preferences

        for (var i = 0; i < numOfQuestions; i++) {
            if (runPreferences[i].answer == userPreferences[i].answer) {
                sameAnswer++;
            }
        }
        run.runPropertyMatch = sameAnswer / numOfQuestions * 100;
    }
    // console.log(run.name+" "+run.runPropertyMatch)
    return run;
}catch(err){
    console.log(err.toString());
}
}
function getScoreNoRunRecord(userPreferences,newrunPreferences){

}
function insertToClass(isSmart, userId, run,runId){
    try {
        var sign = false;
        var details= null;
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
        if(run.DetailsAverage!= undefined){
            details = run.DetailsAverage;
        }
if(!isSmart) {
    var feedRun = {
        id:runId,
        creatorId : run.creatorId,
        name: run.name,
        date: run.date,
        time: run.time,
        creator: run.creator,
        location: run.location,
        distance: run.distance,
        sign: sign,
        preferences: run.preferences,
        maxRunners: "",
        runners: run.runners != undefined ? run.runners : null,
        runPropertyMatch:0,
        distanceFrom: 0
    };
    return feedRun;
}else{
    var smartRun = {
        id:runId,
        name: run.name,
        creatorId : run.creatorId,
        date: run.date,
        time: run.time,
        creator: run.creator,
        location: run.location,
        distance:run.distance,
        sign: sign,
        preferences: run.preferences,
        maxRunners: "",
        runners: run.runners != undefined ? run.runners : null,
       // marked: false,
        //like: false,
        DetailsAverage:details,
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