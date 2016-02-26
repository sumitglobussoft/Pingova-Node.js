/* global require */

var CronJob = require('cron').CronJob;
var con = require('./DBoperations.js');
var async = require('async');

var deleteMedia = new CronJob({
    cronTime: '00 30 3 * * 1-7',
//    cronTime: '00 * * * * 1-7',
    onTick: function () {
        /*
         * Runs every weekday (Monday through Sunday)
         * at 10:30:00 PM. 
         */
        var fs = require('fs');
        console.log("hiiii");
        var todaysDay = Math.floor(Date.now() / 1000);
        console.log("todaysDay::" + todaysDay);
        var subtractVal = 2592000; // 30 days value converted to secs
        var olderSecs = todaysDay - subtractVal;
        console.log("olderSecs" + olderSecs);
        var selectingMediaQuery = "Select * FROM media WHERE last_accessed <=" + olderSecs;
        console.log(selectingMediaQuery);
        con.query(selectingMediaQuery, function (err, rows) {
            if (err) {
                console.log("error in getting old images" + err);
            }
            else {
                var filePath;
                async.forEachSeries(rows, function (item, callback)
                {
                    filePath = item.path;
                    fs.unlink(filePath, function (err) {
                        if (err) {
                            console.log("error in file unlink" + err);
                        } else {
                            var strQuery = "DELETE FROM media WHERE path = '" + filePath + "'";
                            con.query(strQuery, function (err, rows) {
                                if (err) {
                                    console.log("error in deleting" + err);
                                }
                                else {
                                    console.log("successfully deleted from DB");
                                }
                            });
                        }
                    });
                    callback();
                }, function () {
                    console.log("done");
                    var strQuery = "DELETE FROM media WHERE last_accessed <=" + olderSecs;
                    con.query(strQuery, function (err, rows) {
                        if (err) {
                            console.log("error in deleting" + err);
                        }
                        else {
                            console.log("successfully deleted all old datas from DB");
                        }
                    });
                });
            }
        });
    },
    start: false,
    timeZone: 'Asia/Kolkata'
});


var deleteGroup = new CronJob({
    cronTime: '00 30 15 17 6,12 1-7',
    onTick: function () {
        /*
         * Runs every weekday (Monday through Friday)
         * at 11:30:00 AM. It does not run on Saturday
         * or Sunday.
         */
        var strQuery = "DELETE FROM  users WHERE userid not in(Select `group_id` from groupusers ) and contact_isgroup = 1";
        con.query(strQuery, function (err, rows) {
            if (err) {
                console.log("error in deleting" + err);
            }
            else {
                console.log("successfully deleted from DB");
            }
        });
    },
    start: false,
    timeZone: 'America/Los_Angeles'
});

deleteMedia.start();
deleteGroup.start();

