/* global __dirname */

var express = require('express');
var bodyParser = require('body-parser');
var math = require('mathjs');
var app = express();
var async = require('async');
var cors = require('cors');
app.use(cors());
app.use(bodyParser.json());
var randtoken = require('rand-token');
//app.use(express.urlencoded());
app.use(bodyParser.urlencoded({// to support URL-encoded bodies
    extended: true
}));

var con = require('./DBoperations.js');

var thumbgen = require('thumbnails-webvtt');
var uploadeddir = __dirname + '/private/uploaded/files';
var options1 = {
    tmpDir: __dirname + '/private/uploaded/tmp',
    uploadDir: __dirname + '/private/uploaded/files',
    uploadUrl: '/uploaded/files/',
    maxPostSize: 11000000000, // 11 GB
    minFileSize: 1,
    maxFileSize: 10000000000, // 10 GB
    acceptFileTypes: /.+/i,
    // Files not matched by this regular expression force a download dialog,
    // to prevent executing any scripts in the context of the service domain:
    inlineFileTypes: /\.(gif|jpe?g|png)/i,
    imageTypes: /\.(gif|jpe?g|png)/i,
    copyImgAsThumb: true, // required
    imageVersions: {
        maxWidth: 50,
        maxHeight: 50
    },
    accessControl: {
        allowOrigin: '*',
        allowMethods: 'OPTIONS, HEAD, GET, POST, PUT, DELETE',
        allowHeaders: 'Content-Type, Content-Range, Content-Disposition'
    },
    storage: {
        type: 'local',
        aws: {
            accessKeyId: 'xxxxxxxxxxxxxxxxx',
            secretAccessKey: 'xxxxxxxxxxxxxxxxx',
            region: 'us-east-1', //make sure you know the region, else leave this option out
            bucketName: 'xxxxxxxxxxxxxxxxx'
        }
    }
};

var options2 = {
    tmpDir: __dirname + '/../pingova/uploads/tmp',
    uploadDir: __dirname + '/../pingova/uploads/images',
    uploadUrl: '/../pingova/uploads/',
    maxPostSize: 11000000000, // 11 GB
    minFileSize: 1,
    maxFileSize: 10000000000, // 10 GB
    acceptFileTypes: /.+/i,
    // Files not matched by this regular expression force a download dialog,
    // to prevent executing any scripts in the context of the service domain:
    inlineFileTypes: /\.(gif|jpe?g|png)/i,
    imageTypes: /\.(gif|jpe?g|png)/i,
    copyImgAsThumb: true, // required
    imageVersions: {
        maxWidth: 200,
        maxHeight: 200
    },
    accessControl: {
        allowOrigin: '*',
        allowMethods: 'OPTIONS, HEAD, GET, POST, PUT, DELETE',
        allowHeaders: 'Content-Type, Content-Range, Content-Disposition'
    },
    storage: {
        type: 'local',
        aws: {
            accessKeyId: 'xxxxxxxxxxxxxxxxx',
            secretAccessKey: 'xxxxxxxxxxxxxxxxx',
            region: 'us-east-1', //make sure you know the region, else leave this option out
            bucketName: 'xxxxxxxxxxxxxxxxx'
        }
    }
};

// inti the library
var libRequried = require('blueimp-file-upload-expressjs');

app.get('/upload', function (req, res) {
    var uploader = libRequried(options1);
    uploader.get(req, res, function (err, obj) {
        if (!err) {
            res.send(JSON.stringify(obj));
        }
    });
});

app.post('/upload-image', function (req, res) {
    var uploader = libRequried(options1);
    uploader.post(req, res, function (error, obj, redirect) {
        if (!error)
        {
            var lastAccessed = Math.floor(Date.now() / 1000);
            var name = obj.files[0].name;
            var size = obj.files[0].size;
            var type = obj.files[0].type;
            var url = obj.files[0].url;
            var thumbnailUrl = obj.files[0].thumbnailUrl;
            var mediaType = "image";
            console.log("name::" + name);
            console.log("size::" + size);
            console.log("type::" + type);
            console.log("url::" + url);
            console.log("thumbnailUrl::" + thumbnailUrl);


            //     var imgThumb = uploadeddir + '/thumbnail/' + obj.files[0].name;
            //    console.log("imgThumb::" + imgThumb);
            //   var fs = require("fs");
            //  fs.readFile(imgThumb, function (err, data) {
            //  if (err)
            //       throw err;
            // Encode to base64
            //   var encodedImage = new Buffer(data, 'binary').toString('base64');
            // console.log(encodedImage);
            // Decode from base64
//                    var decodedImage = new Buffer(encodedImage, 'base64').toString('binary');
//                    console.log(decodedImage);

            var strQuery = "INSERT INTO media( stored_name, path, path_thumb , extension, size, media_type, last_accessed) VALUES ('" + name + "','/private/uploaded/files/" + name + "','/private/uploaded/files/thumbnail/" + name + "','" + type + "'," + size + ",'" + mediaType + "'," + lastAccessed + ")";
            console.log(strQuery);
            con.query(strQuery, function (err, rows) {
                if (err) {
                    console.log(err);
                    res.send({status: 403, data: 'error occured'});
                }
                else {
                    res.send({status: 200, storedName: name, path: 'private/uploaded/files/' + name, path_thumb: 'private/uploaded/files/thumbnail/' + name, extension: type, size: size});
                }
            });
            //  });
            // res.send(JSON.stringify(obj));
        }
        else {
            res.send({status: 403, data: 'error occured'});
        }
    });

});

app.post('/upload-audio', function (req, res) {
    var uploader = libRequried(options1);
    uploader.post(req, res, function (error, obj, redirect) {
        if (!error)
        {
            var lastAccessed = Math.floor(Date.now() / 1000);
            var name = obj.files[0].name;
            var size = obj.files[0].size;
            var type = obj.files[0].type;
            var url = obj.files[0].url;
            var mediaType = "audio";
            console.log("name::" + name);
            console.log("size::" + size);
            console.log("type::" + type);
            console.log("url::" + url);
            var strQuery = "INSERT INTO media( stored_name, path, extension, size, media_type, last_accessed) VALUES ('" + name + "','/private/uploaded/files/" + name + "','" + type + "'," + size + ",'" + mediaType + "'," + lastAccessed + ")";
            console.log(strQuery);
            con.query(strQuery, function (err, rows) {
                if (err) {
                    console.log(err);
                    res.send({status: 403, data: 'error occured'});
                }
                else {
                    res.send({status: 200, storedName: name, path: 'private/uploaded/files/' + name, extension: type, size: size});
                }
            });
            //res.send(JSON.stringify(obj));
        } else {
            res.send({status: 403, data: 'error occured'});
        }
    });

});

app.post('/upload-video', function (req, res) {
    var uploader = libRequried(options1);
    uploader.post(req, res, function (error, obj, redirect) {

        if (!error) {
            var lastAccessed = Math.floor(Date.now() / 1000);
            var name = obj.files[0].name;
            var size = obj.files[0].size;
            var type = obj.files[0].type;
            var url = obj.files[0].url;

            var mediaType = "video";
            var videopath = uploadeddir + '/' + obj.files[0].name;
            var thumbpath = uploadeddir + '/thumbnail/' + obj.files[0].name + ".vtt";


            thumbgen(videopath, {
                output: thumbpath,
                size: {
                    width: 75
                },
                numThumbnails: 1,
                spritesheet: false
            }, function (err, metadata) {
                console.log(metadata);
                if (err) {
                    console.log(err);
                    res.send({status: 403, data: 'error occured'});
                } else {
//                var response = {
//                    data1: obj,
//                    data2: metadata
//                };
                    var thumbpath = metadata.thumbnailsData[0].path;
                    var thumbname = thumbpath.split('#');
                    var video_thumb = 'private/uploaded/files/thumbnail' + thumbname[0];
                    //    var videopathThumb = uploadeddir + '/thumbnail' + thumbname[0];
                    //   console.log(videopathThumb);
                    // var fs = require("fs");

//                fs.readFile(videopathThumb, function (err, data) {
//                    if (err)
//                        throw err;
//                    // Encode to base64
//                    var encodedImage = new Buffer(data, 'binary').toString('base64');
                    //  console.log(encodedImage);
                    // Decode from base64
//                    var decodedImage = new Buffer(encodedImage, 'base64').toString('binary');
//                    console.log(decodedImage);

                    var strQuery = "INSERT INTO media( stored_name, path, path_thumb , extension, size, media_type, last_accessed) VALUES ('" + name + "','/private/uploaded/files/" + name + "','" + video_thumb + "','" + type + "'," + size + ",'" + mediaType + "'," + lastAccessed + ")";
                    //     console.log(strQuery);
                    con.query(strQuery, function (err, rows) {
                        if (err) {
                            console.log(err);
                            res.send({status: 403, data: 'error occured'});
                        }
                        else {
                            res.send({status: 200, storedName: name, path: 'private/uploaded/files/' + name, path_thumb: video_thumb, extension: type, size: size});
                        }
                    });
                }
                //   });
//              res.send(response);
            });

        } else {
            res.send({status: 403, data: 'error occured'});
        }
    });

});

// the path SHOULD match options.uploadUrl
app.delete('/uploaded/files/:name', function (req, res) {
    var uploader = libRequried(options1);
    uploader.delete(req, res, function (err, obj) {
        res.Json({error: err});
    });

});

app.get('/deleteMedia', function (req, res) {
    var uploader = libRequried(options1);
    uploader.get(req, res, function (err, obj) {
        if (!err) {
            res.send(JSON.stringify(obj));
        }
    });
});

app.post('/pinexists', function (req, res) {
    var pin = req.body.pin;
    //res.send(req.body.pin);

    if ((pin === undefined) || (pin.length === 0)) {
        console.log('No data provided');
        res.json({status: 402, data: 'no pin provided'});
    } else {
        var strQuery = "SELECT * FROM users WHERE pin_no = '" + pin + "'";
        con.query(strQuery, function (err, rows) {
            if (err) {
                console.log(err);
                res.json({status: 403, data: 'error occured'});
            }
            else {
                console.log('Data received from Db:\n');
                console.log(rows);
                if (rows.length > 0) {
                    res.json({status: 200, user_pin: pin, pin_exits: 1});
                }
                else {
                    res.json({status: 200, user_pin: pin, pin_exits: 0});
                }
            }
        });
    }
});

app.post('/removemedia', function (req, res) {
    var fs = require('fs');
    var filePath = req.body.filepath;
    console.log("filePath:" + filePath);
    var fullfilepath = __dirname + filePath;
    fs.unlink(fullfilepath, function (err) {
        if (err) {
            console.log(err);
            res.json({status: 403, data: 'error occured'});
        } else {
            var strQuery = "DELETE FROM media WHERE path = '" + filePath + "'";
            con.query(strQuery, function (err, rows) {
                if (err) {
                    console.log(err);
                    res.json({status: 403, data: 'error occured:Deleted from folder but not DB'});
                }
                else {
                    res.json({status: 200, data: 'Done deleting from DB and folder'});

                }
            });
        }
    });
});

app.post('/mediaexists', function (req, res) {
    var mediaUrl = req.body.media_url;
    if (mediaUrl.length === 0) {
        console.log('No data provided');
        res.json({status: 402, data: 'no mediaUrl provided'});
    } else {
        var strQuery = "SELECT * FROM media WHERE path = '" + mediaUrl + "'";
        console.log(strQuery);
        con.query(strQuery, function (err, rows) {
            if (err) {
                console.log(err);
                res.json({status: 403, data: 'error occured'});
            }
            else {
                console.log('Data received from Db:\n');
                console.log(rows);
                if (rows.length > 0) {
                    var lastAccessed = Math.floor(Date.now() / 1000);
                    var updateQuery = "UPDATE media SET last_accessed = " + lastAccessed + " where path = '" + mediaUrl + "'";
                    con.query(updateQuery, function (err, rows) {
                        res.json({status: 200, media_url: mediaUrl, media_exits: 1});
                    });
                }
                else {
                    res.json({status: 200, media_exits: 0});
                }
            }
        });
    }
});

app.post('/phonenoexists', function (req, res) {
    var phoneNo = req.body.phone_no;
    if (phoneNo.length === 0) {
        console.log('No data provided');
        res.json({status: 402, data: 'no phoneNo provided'});
    } else {
        var strQuery = "SELECT * FROM users WHERE phone_no = " + phoneNo + "";
        console.log(strQuery);
        con.query(strQuery, function (err, rows) {
            if (err) {
                console.log(err);
                res.json({status: 403, data: 'error occured'});
            }
            else {
                console.log('Data received from Db:\n');
                console.log(rows);
                if (rows.length > 0) {
                    var jsonObj = {};
                    jsonObj.user_id = rows[0].userid;
                    jsonObj.phone_no = rows[0].phone_no;
                    jsonObj.pin_no = rows[0].pin_no;
                    jsonObj.contact_displayname = rows[0].contact_displayname;
                    jsonObj.contact_status = rows[0].contact_status;
                    jsonObj.contact_gender = rows[0].contact_gender;
                    jsonObj.contact_profilepic = rows[0].contact_profilepic;
                    jsonObj.contact_profilepicthumb = rows[0].contact_profilepicthumb;
                    jsonObj.contact_isnovisible = rows[0].contact_isnovisible;
                    jsonObj.contact_isgroup = rows[0].contact_isgroup;
                    jsonObj.contact_privacy_pic = rows[0].contact_privacy_pic;
                    jsonObj.contact_sequence = rows[0].contact_sequence;


                    res.json({status: 200, phone_no: phoneNo, phone_no_exits: 1, data: jsonObj});

                }
                else {
                    res.json({status: 200, phone_no_exits: 0});
                }
            }
        });
    }
});


app.post('/upload-profile-pic/:id', function (req, res) {
    var uploader2 = libRequried(options2);
    var fs = require('fs');
    var userId = req.params.id;
    console.log("userId::::" + userId);
//    var userId = 213;
    uploader2.post(req, res, function (error, obj, redirect) {
        if (!error)
        {
            var lastAccessed = Math.floor(Date.now() / 1000);
            var name = obj.files[0].name;
            var size = obj.files[0].size;
            var type = obj.files[0].type;
            var url = obj.files[0].url;
            var thumbnailUrl = obj.files[0].thumbnailUrl;
            var mediaType = "image";
            console.log("name::" + name);
            console.log("size::" + size);
            console.log("type::" + type);
            console.log("url::" + url);
            console.log("thumbnailUrl::" + thumbnailUrl);

            var selectQuery = "SELECT * from  users where userid=" + userId;
            console.log(selectQuery);
            con.query(selectQuery, function (err, rows) {
                if (rows.length > 0) {
                    var filePath = rows[0].contact_profilepic;
                    var filePathThumb = rows[0].contact_profilepicthumb;
                    console.log("filePath:" + filePath + "::::::filePathThumb:" + filePathThumb);
//                    var appendPath = __dirname + "/../pingova/";
//                    if ((filePath !== null) && (filePath.length > 0)) {
//                        var fullFilePath = appendPath + filePath;
//                        var fullFilePathThumb = appendPath + filePathThumb;
//                        fs.unlink(fullFilePath, function (err) {
//                            if (err) {
//                                console.log(err);
//                                console.log({status: 403, data: 'error occured'});
//                            } else {
//                                fs.unlink(fullFilePathThumb, function (err) {
//                                    if (err) {
//                                        console.log(err);
//                                        console.log({status: 403, data: 'error occured:Deleted from folder but not DB'});
//                                    }
//                                    else {
//                                        console.log({status: 200, data: 'Done deleting from DB and folder'});
//
//                                    }
//                                });
//                            }
//                        });
//                    }

                    var updateQuery = "UPDATE users SET contact_profilepic='uploads/images/" + name + "', contact_profilepicthumb='uploads/images/thumbnail/" + name + "' where userid=" + userId;
                    console.log(updateQuery);
                    con.query(updateQuery, function (err, rows) {
                        if (err) {
                            console.log(err);
                            res.send({status: 403, data: 'error occured'});
                        }
                        else {
                            name = name.replace(" ", "%20");
                            res.send({status: 200, storedName: name, path: 'uploads/images/' + name, path_thumb: 'uploads/images/thumbnail/' + name, extension: type, size: size});
                        }
                    });
                }
            });
            // res.send(JSON.stringify(obj));
        }
        else {
            res.send({status: 403, data: 'error occured'});
        }
    });

});

app.post('/pinSearchUserGroup', function (req, res) {
    var members_list = [];
    var pin = req.body.pin;
    var userId = req.body.user_id;
    if (pin === undefined) {
        console.log('No data provided');
        res.json({status: 402, data: 'please provide pin'});
    }
    if (pin.length === 0) {
        console.log('No data provided');
        res.json({status: 402, data: 'no pin value provided'});
    } else {
//SELECT * FROM users WHERE contact_isgroup = 0 and `pin_no` like '%user%' and  userid not in ( SELECT `user_id` FROM `blocklist` WHERE `blocked_user_id` = 103 UNION  SELECT `blocked_user_id` FROM `blocklist` WHERE `user_id` =103 )  UNION SELECT * FROM `users` WHERE `contact_isgroup` = 0 and `contact_isnovisible` = 1 and `pin_no` like '%user%';
        var strQuery = "SELECT * FROM users WHERE contact_isgroup = 0 and pin_no like '%" + pin + "%' and  userid not in ( SELECT `user_id` FROM `blocklist` WHERE `blocked_user_id` = " + userId + " UNION  SELECT `blocked_user_id` FROM `blocklist` WHERE `user_id` =" + userId + " ) and userid!=" + userId + "  UNION SELECT * FROM users WHERE contact_isgroup = 1 and contact_isnovisible = 1 and  pin_no like '%" + pin + "%'";
        console.log(strQuery);
        con.query(strQuery, function (err, rows) {
            if (err) {
                console.log(err);
                res.json({status: 403, data: 'error occured'});
            }
            else {
                console.log('Data received from Db:\n');
                console.log(rows);
                if (rows.length > 0) {
                    async.forEachSeries(rows, function (member, callback)
                    {
                        var members_data = {};
                        members_data.user_id = member.userid;
                        members_data.pin_no = member.pin_no;
                        members_data.contact_displayname = member.contact_displayname;
                        members_data.contact_status = member.contact_status;
                        members_data.contact_gender = member.contact_gender;
                        members_data.contact_profilepic = member.contact_profilepic;
                        members_data.contact_profilepicthumb = member.contact_profilepicthumb;
                        members_data.contact_isnovisible = member.contact_isnovisible;
                        members_data.contact_isgroup = member.contact_isgroup;
                        members_data.contact_privacy_pic = member.contact_privacy_pic;
                        members_data.contact_sequence = member.contact_sequence;
                        members_data.created_time = member.created_time;
                        members_data.created_by = member.created_by;
                        members_list.push(members_data);
                        callback();
                    }, function () {
//                        members_Object = JSON.stringify(members_list);
                        res.json({status: 200, pin: pin, pin_exits: 1, data: members_list});
                    });
                }
                else {
                    res.json({status: 200, pin_exits: 0});
                }
            }
        });
    }
});

var accountSid = 'AC8411050af25985df243d5b3741935364';
var authToken = '2cc43c38329da8d32ed25c64e37c7265';

app.post('/generateVerificationCode', function (req, res) {
    var phoneNo = req.body.phone_no;
    var verificationcode;
    var Low = 10000;
    var High = 99999;

    verificationcode = math.randomInt(Low, High);
    console.log(verificationcode);
    // Twilio Credentials 

    //require the Twilio module and create a REST client 
    var client = require('twilio')(accountSid, authToken);

//INSERT INTO table (id, name, age) VALUES(1, "A", 19) ON DUPLICATE KEY UPDATE    
//name="A", age=19
    var strQuery = "INSERT INTO phonevarification ( phone_no , verification_code) VALUES(" + phoneNo + ", " + verificationcode + " )  ON DUPLICATE KEY UPDATE verification_code = " + verificationcode;
    console.log(strQuery);
    con.query(strQuery, function (err, rows) {
        if (err) {
            console.log(err);
            res.json({status: 403, data: 'error occured'});
        }
        else {
            console.log('Data received from Db:\n');
            console.log(rows);
            client.messages.create({
                to: "+918818896667",
                from: "+12566001177",
                body: "Your Pingova verification code is: " + verificationcode
            }, function (err, message) {
                if (err) {
                    console.log(err);
                    if (err.status === 400) {
                        res.json({status: 403, data: 'The Number is not valid'});
                    }
                    res.json({status: 403, data: 'error occured'});
                } else {
                    console.log(message);
                    res.json({status: 200, data: 'message sent successfully'});
                }
                console.log(message);
            });

        }
    });
});

app.post('/verifyCode', function (req, res) {
    var verificationCode = req.body.verification_code;
    var phoneNo = req.body.phone_no;
    console.log(verificationCode);
    var strQuery = "SELECT * from phonevarification WHERE verification_code = " + verificationCode + " and phone_no = " + phoneNo;
    console.log(strQuery);
    con.query(strQuery, function (err, rows) {
        if (err) {
            console.log(err);
            res.json({status: 403, data: 'error occured'});
        }
        else {
            console.log('Data received from Db:\n');
            console.log(rows);
            if (rows.length > 0) {
                var strQuery = "DELETE from phonevarification WHERE verification_code = " + verificationCode + " and phone_no = " + phoneNo;
                console.log(strQuery);
                con.query(strQuery);
                res.json({status: 200, data: 'Account verified successfully'});
            } else {
                res.json({status: 200, data: 'Verification failed'});
            }

        }
    });
});


// admin services
app.post('/admin/login', function (req, res) {
    console.log("inside log");
    console.log(req.body);
    var username = req.body.username;
    var password = req.body.password;
    if ((username !== null) && (username.length > 0)) {
        if ((password !== null) && (password.length > 0)) {


            var selectAdmin = "SELECT * from admininfo where USERNAME='" + username + "' and password = '" + password + "'";

            con.query(selectAdmin, function (err, rows) {
                if (err) {
                    res.json({status: 403, data: 'Error fetching data'});
                } else {
                    if (rows.length > 0) {
                        console.log("successfully logged in");
                        // Generate a 16 character alpha-numeric token:
                        var token = randtoken.generate(16);
                        var updateAdminTokenQuery = "UPDATE admininfo SET TOKEN = '" + token + "' where USERNAME='" + username + "' and password = '" + password + "'";
                        con.query(updateAdminTokenQuery, function (err, rows1) {
                            if (err) {
                                res.json({status: 403, data: 'Error fetching data'});
                            } else {
                                var admindata = {};

                                admindata.status = 200;
                                admindata.data = "successfully logged in";
                                admindata.token = token;
                                admindata.admin_id = rows[0].ID;
                                admindata.username = rows[0].USERNAME;
                                admindata.name = rows[0].NAME;
                                admindata.phone_number = rows[0].PHONE_NUMBER;
                                admindata.email_id = rows[0].EMAIL_ID;
                                res.json(admindata);
                            }
                        });
                    }
                    else {
                        res.json({status: 403, data: 'invalid username or password'});
                    }
                }
            });
        }
        else {
            res.json({status: 403, data: 'Please enter password'});
        }
    }
    else {
        res.json({status: 403, data: 'Please enter username'});
    }
});

app.get('/admin/users', function (req, res) {
    var token = req.query.token;
    console.log(token);
    var checksequenceQuery = "SELECT * from admininfo where TOKEN = '" + token + "'";
    con.query(checksequenceQuery, function (err, seq) {
        if (err) {
        }
        else {
            if (seq.length > 0) {
                var fetchUsersQuery = "SELECT * from users where contact_isgroup = 0";
                con.query(fetchUsersQuery, function (err, rows) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        var jsonMainobject = {};
                        jsonMainobject.status = 200;
                        var membersList = [];
                        async.forEachSeries(rows, function (member, callback) {
                            var jsonObject = {};

                            jsonObject.user_id = member.userid;
                            jsonObject.pin_no = member.pin_no;
                            jsonObject.phone_no = member.phone_no;
                            jsonObject.contact_displayname = member.contact_displayname;
                            jsonObject.contact_gender = member.contact_gender;
                            jsonObject.contact_status = member.contact_status;
                            jsonObject.contact_profilepic = member.contact_profilepic;
                            jsonObject.contact_profilepicthumb = member.contact_profilepicthumb;
                            jsonObject.contact_isnovisible = member.contact_isnovisible;
                            jsonObject.contact_privacy_pic = member.contact_privacy_pic;
                            membersList.push(jsonObject);
                            callback();
                        }, function () {
                            jsonMainobject.membersList = membersList;
                            res.json(jsonMainobject);
                        });
                    }
                });
            }
            else {
                res.json({status: 403, data: 'Login Expired'});
            }
        }
    });

});

app.get('/admin/userinfo', function (req, res) {
    var token = req.query.token;
    var userId = req.query.user_id;
    var sequenceCheckQuery = "SELECT * from admininfo where TOKEN = '" + token + "'";
    con.query(sequenceCheckQuery, function (err, results) {
        if (err) {
            res.json({status: 403, data: 'erorr occured'});
        } else {
            if (results.length > 0) {
                // sequence true
                var groupinfoQuery = "SELECT * FROM groupusers,users WHERE group_id=userid and user_id = " + userId;
                con.query(groupinfoQuery, function (err, userinfo) {
                    if (err) {
                        res.json({status: 403, data: 'erorr occured'});
                    }
                    else {
                        var mainObject = {};
                        var groupList = [];
                        mainObject.status = 200;
                        mainObject.data = "successfully fetched the data";
                        async.forEachSeries(userinfo, function (member, callback) {
                            console.log(member.created_time);
                            var jsonObject = {};
                            jsonObject.group_id = member.group_id;
                            jsonObject.user_id = member.user_id;
                            jsonObject.group_pin = member.pin_no;
                            jsonObject.is_moderator = member.is_moderator;
                            jsonObject.contact_displayname = member.contact_displayname;
                            jsonObject.contact_status = member.contact_status;
                            jsonObject.contact_profilepic = member.contact_profilepic;
                            jsonObject.contact_profilepicthumb = member.contact_profilepicthumb;
                            jsonObject.created_time = member.created_time;
                            jsonObject.created_by = member.created_by;

                            groupList.push(jsonObject);
                            callback();
                        }, function () {
                            mainObject.groupList = groupList;
                            res.json(mainObject);
                        });
                    }
                });
            }
            else {
                res.json({status: 403, data: 'Login Expired'});
            }
        }
    });
});

app.get('/admin/groups', function (req, res) {
    var token = req.query.token;
    var sequenceCheckQuery = "SELECT * from admininfo where TOKEN = '" + token + "'";
    con.query(sequenceCheckQuery, function (err, results) {
        if (err) {
            res.json({status: 403, data: 'erorr occured'});
        } else {
            if (results.length > 0) {
                // sequence true
                var groupinfoQuery = "SELECT * from users where contact_isgroup = 1";
                con.query(groupinfoQuery, function (err, groupinfo) {
                    if (err) {
                        res.json({status: 403, data: 'erorr occured'});
                    }
                    else {
                        var mainObject = {};
                        var groupList = [];
                        mainObject.status = 200;
                        mainObject.data = "successfully fetched the data";
                        async.forEachSeries(groupinfo, function (group, callback) {
                            var jsonObject = {};
                            jsonObject.group_id = group.userid;
                            jsonObject.group_pin = group.pin_no;
                            jsonObject.group_name = group.contact_displayname;
                            jsonObject.contact_profilepic = group.contact_profilepic;
                            jsonObject.contact_profilepicthumb = group.contact_profilepicthumb;
                            jsonObject.contact_isnovisible = group.contact_isnovisible;
                            jsonObject.contact_privacy_pic = group.contact_privacy_pic;
                            jsonObject.created_time = group.created_time;
                            jsonObject.created_by = group.created_by;
                            groupList.push(jsonObject);
                            callback();
                        }, function () {
                            mainObject.groupList = groupList;
                            res.json(mainObject);
                        });
                    }
                });
            }
            else {
                res.json({status: 403, data: 'Login Expired'});
            }
        }
    });
});

app.get('/admin/groupinfo', function (req, res) {
    var token = req.query.token;
    var groupId = req.query.group_id;
    var sequenceCheckQuery = "SELECT * from admininfo where TOKEN = '" + token + "'";
    con.query(sequenceCheckQuery, function (err, results) {
        if (err) {
            res.json({status: 403, data: 'erorr occured'});
        } else {
            if (results.length > 0) {
                // sequence true
                var groupinfoQuery = "SELECT * from users, groupusers where groupusers.user_id = users.userid and groupusers.group_id = " + groupId;
                con.query(groupinfoQuery, function (err, groupinfo) {
                    if (err) {
                        res.json({status: 403, data: 'erorr occured'});
                    }
                    else {
                        var mainObject = {};
                        var memberList = [];
                        mainObject.status = 200;
                        mainObject.data = "successfully fetched the data";
                        async.forEachSeries(groupinfo, function (member, callback) {
                            var jsonObject = {};
                            jsonObject.user_id = member.userid;
                            jsonObject.phone_no = member.phone_no;
                            jsonObject.pin_no = member.pin_no;
                            jsonObject.contact_displayname = member.contact_displayname;
                            jsonObject.contact_status = member.contact_status;
                            jsonObject.contact_gender = member.contact_gender;
                            jsonObject.contact_profilepic = member.contact_profilepic;
                            jsonObject.contact_profilepicthumb = member.contact_profilepicthumb;
                            jsonObject.contact_isnovisible = member.contact_isnovisible;
                            jsonObject.contact_privacy_pic = member.contact_privacy_pic;
                            jsonObject.is_moderator = member.is_moderator;
                            memberList.push(jsonObject);
                            callback();
                        }, function () {
                            mainObject.memberList = memberList;
                            res.json(mainObject);
                        });
                    }
                });
            }
            else {
                res.json({status: 403, data: 'Login Expired'});
            }
        }
    });
});


//to change Admin password
app.post('/admin/changepassword', function (req, res) {

    var token = req.body.token;
    var oldpassword = req.body.old_password;
    var newPassword = req.body.new_password;
    var sequenceCheckQuery = "SELECT * from admininfo where TOKEN = '" + token + "'";
    console.log(sequenceCheckQuery);
    con.query(sequenceCheckQuery, function (err, results) {
        if (err) {
            res.json({status: 403, data: 'erorr occured'});
        } else {
            console.log(results.length);
            if (results.length > 0) {
                var getalladvertisesQuery = "SELECT * from admininfo where USERNAME = 'admin' and PASSWORD='" + oldpassword + "'";
                con.query(getalladvertisesQuery, function (err, rows) {
                    if (err) {
                        res.json({status: 403, data: 'erorr occured'});
                    } else {
                        console.log(rows.length);
                        if (rows.length > 0) {
                            var getalladvertisesQuery = "UPDATE admininfo SET PASSWORD = '" + newPassword + "' where PASSWORD='" + oldpassword + "'";
                            console.log(getalladvertisesQuery);
                            con.query(getalladvertisesQuery, function (err, rows2) {
                                if (err) {
                                    res.json({status: 403, data: 'erorr occured'});
                                } else {
                                    console.log(rows2);
                                    if (rows2.changedRows === 1) {
                                        res.json({status: 200, data: 'password updated'});
                                    }
                                }
                            });
                        }
                        else {
                            res.json({status: 403, data: 'invalid old password'});
                        }
                    }
                });
            }
        }
    });
});


//fetching data of visible contacts to update with recent data
app.post('/updateUserData', function (req, res) {

    var members_list = [];
    var arrayMembers = req.body.array_members;
    console.log(arrayMembers);
    
    arrayMembers = arrayMembers.replace('[','').replace(']','');


    var strQuery = "SELECT * FROM users WHERE userid in (" + arrayMembers + ")";
    console.log(strQuery);
    con.query(strQuery, function (err, rows) {
        if (err) {
            res.json({status: 403, data: 'erorr occured'});
            console.log(err);
//                    throw err;
        } else {
          
            async.forEachSeries(rows, function (member, callback)
            {
                var members_data = {};
                members_data.user_id = member.userid;
                members_data.pin_no = member.pin_no;
                members_data.contact_displayname = member.contact_displayname;
                members_data.contact_status = member.contact_status;
                members_data.contact_gender = member.contact_gender;
                members_data.contact_profilepic = member.contact_profilepic;
                members_data.contact_profilepicthumb = member.contact_profilepicthumb;

                members_list.push(members_data);
                callback();
            }, function () {
                res.json({status: 200, data: members_list});
            });
        }
    });
});


app.listen(3001, function () {
    console.log("Uploader is running on 3001");
});