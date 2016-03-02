/* global __dirname */

var express = require('express');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json());
//app.use(express.urlencoded());
app.use(bodyParser.urlencoded({// to support URL-encoded bodies
    extended: true
}));

var con = require('./DBoperations.js');

var thumbgen = require('thumbnails-webvtt');
var uploadeddir = __dirname + '/private/uploaded/files';
var options = {
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

// init the uploader
var uploader = require('blueimp-file-upload-expressjs')(options);

// init the uploader
var uploader2 = require('blueimp-file-upload-expressjs')(options2);

app.get('/upload', function (req, res) {
    uploader.get(req, res, function (err, obj) {
        if (!err) {
            res.send(JSON.stringify(obj));
        }
    });
});

app.post('/upload-image', function (req, res) {
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


            var imgThumb = uploadeddir + '/thumbnail/' + obj.files[0].name;
            console.log("imgThumb::" + imgThumb);
            var fs = require("fs");
            fs.readFile(imgThumb, function (err, data) {
                if (err)
                    throw err;
                // Encode to base64
                var encodedImage = new Buffer(data, 'binary').toString('base64');
                // console.log(encodedImage);
                // Decode from base64
//                    var decodedImage = new Buffer(encodedImage, 'base64').toString('binary');
//                    console.log(decodedImage);

                var strQuery = "INSERT INTO media( stored_name, path, path_thumb , file, extension, size, media_type, last_accessed) VALUES ('" + name + "','/private/uploaded/files/" + name + "','/private/uploaded/files/thumbnail/" + name + "','" + encodedImage + "','" + type + "'," + size + ",'" + mediaType + "'," + lastAccessed + ")";
                console.log(strQuery);
                con.query(strQuery, function (err, rows) {
                    if (err) {
                        console.log(err);
                        res.send({status: 403, data: 'error occured'});
                    }
                    else {
                        res.send({status: 200, storedName: name, path: 'private/uploaded/files/' + name, path_thumb: 'private/uploaded/files/thumbnail/' + name, file: encodedImage, extension: type, size: size});
                    }
                });
            });
            // res.send(JSON.stringify(obj));
        }
        else {
            res.send({status: 403, data: 'error occured'});
        }
    });

});

app.post('/upload-audio', function (req, res) {
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
                    throw err;
                }
//                var response = {
//                    data1: obj,
//                    data2: metadata
//                };
                var thumbpath = metadata.thumbnailsData[0].path;
                var thumbname = thumbpath.split('#');
                var video_thumb = 'private/uploaded/files/thumbnail' + thumbname[0];
                var videopathThumb = uploadeddir + '/thumbnail' + thumbname[0];
                console.log(videopathThumb);
                var fs = require("fs");

                fs.readFile(videopathThumb, function (err, data) {
                    if (err)
                        throw err;
                    // Encode to base64
                    var encodedImage = new Buffer(data, 'binary').toString('base64');
                    //  console.log(encodedImage);
                    // Decode from base64
//                    var decodedImage = new Buffer(encodedImage, 'base64').toString('binary');
//                    console.log(decodedImage);

                    var strQuery = "INSERT INTO media( stored_name, path, path_thumb , file, extension, size, media_type, last_accessed) VALUES ('" + name + "','/private/uploaded/files/" + name + "','" + video_thumb + "','" + encodedImage + "','" + type + "'," + size + ",'" + mediaType + "'," + lastAccessed + ")";
                    //     console.log(strQuery);
                    con.query(strQuery, function (err, rows) {
                        if (err) {
                            console.log(err);
                            res.send({status: 403, data: 'error occured'});
                        }
                        else {
                            res.send({status: 200, storedName: name, path: 'private/uploaded/files/' + name, path_thumb: video_thumb, file: encodedImage, extension: type, size: size});
                        }
                    });

                });
//              res.send(response);
            });

        } else {
            res.send({status: 403, data: 'error occured'});
        }
    });

});

// the path SHOULD match options.uploadUrl
app.delete('/uploaded/files/:name', function (req, res) {
    uploader.delete(req, res, function (err, obj) {
        res.Json({error: err});
    });

});

app.get('/deleteMedia', function (req, res) {
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


app.post('/upload-profile-pic', function (req, res) {
    var fs = require('fs');
    var userId = req.body.user_id;
//    var userId = 103;
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
                    var appendPath = __dirname + "/../pingova/";
                    if ((filePath !== null) && (filePath.length > 0)) {
                        var fullFilePath = appendPath + filePath;
                        var fullFilePathThumb = appendPath + filePathThumb;
                        fs.unlink(fullFilePath, function (err) {
                            if (err) {
                                console.log(err);
                                console.log({status: 403, data: 'error occured'});
                            } else {
                                fs.unlink(fullFilePathThumb, function (err) {
                                    if (err) {
                                        console.log(err);
                                        console.log({status: 403, data: 'error occured:Deleted from folder but not DB'});
                                    }
                                    else {
                                        console.log({status: 200, data: 'Done deleting from DB and folder'});

                                    }
                                });
                            }
                        });
                    }
                    name = name.replace(" ", "%20");
                    var updateQuery = "UPDATE users SET contact_profilepic='uploads/images/" + name + "', contact_profilepicthumb='uploads/images/thumbnail/" + name + "' where userid="+userId;
                    console.log(updateQuery);
                    con.query(updateQuery, function (err, rows) {
                        if (err) {
                            console.log(err);
                            res.send({status: 403, data: 'error occured'});
                        }
                        else {
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

app.listen(3001, function () {
    console.log("Uploader is running on 3001");
});