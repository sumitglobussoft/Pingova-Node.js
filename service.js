var express = require("express");
var multer = require('multer');
var app = express();
var util = require('util');
var bodyParser = require('body-parser');

var uploadImage = multer({dest: './uploads/image'});
var uploadAudio = multer({dest: './uploads/audio'});
var uploadVideo = multer({dest: './uploads/video'});
var uploadFile = multer({dest: './uploads/file'});
var contactImage = multer({dest: './uploads/contact'});
var defaultPath = multer({dest: './uploads/defaultFolder'});


var con = require('./DBoperations.js');
//app.use(express.bodyParser());
app.use(bodyParser.json());
//app.use(express.urlencoded());
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
app.use('/files', express.static(__dirname + '/uploads'));

app.post('/upload-image', uploadImage, function (req, res) {
    var filesUploaded = 0;
    if (Object.keys(req.files).length === 0) {
        console.log('No files uploaded');
    } else {
        console.log("in");
        var newName = req.files['my-file'].name;
        var filePath = req.files['my-file'].path;
        var fileExtension = req.files['my-file'].extension;
        var fileSize = req.files['my-file'].size;
        var files = req.files.file1;
        if (!util.isArray(req.files.file1)) {
            files = [req.files.file1];
        }
        filesUploaded = files.length;
        var lastAccessed = Math.floor(Date.now() / 1000);
        var strQuery = "INSERT INTO media( stored_name, path, extension, size, media_type, last_accessed) VALUES ('" + newName + "','uploads/image/" + newName + "','" + fileExtension + "'," + fileSize + ",'image'," + lastAccessed + ")";
        console.log(strQuery);
        con.query(strQuery, function (err, rows) {
            if (err) {
                console.log(err);
                res.json({status: 403, data: 'error occured'});
            }
            else {
                res.json({status: 200, storedName: newName, path: 'uploads/image/' + newName, extension: fileExtension, size: fileSize});
            }
        });
    }
});

app.post('/upload-audio', uploadAudio, function (req, res) {
    console.log(req.body)
    var filesUploaded = 0;
    if (Object.keys(req.files).length === 0) {
        console.log('No files uploaded');
    } else {
        var newName = req.files['my-file'].name;
        var filePath = req.files['my-file'].path;
        var fileExtension = req.files['my-file'].extension;
        var files = req.files.file1;
        var fileSize = req.files['my-file'].size;
        if (!util.isArray(req.files.file1)) {
            files = [req.files.file1];
        }
        filesUploaded = files.length;
        var lastAccessed = Math.floor(Date.now() / 1000);
        var strQuery = "INSERT INTO media( stored_name, path, extension, size, media_type, last_accessed) VALUES ('" + newName + "','uploads/audio/" + newName + "','" + fileExtension + "'," + fileSize + ",'audio'," + lastAccessed + ")";
        console.log(strQuery);
        con.query(strQuery, function (err, rows) {
            if (err) {
                console.log(err);
                res.json({status: 403, data: 'error occured'});
            }
            else {
                res.json({status: 200, storedName: newName, path: 'uploads/image/' + newName, extension: fileExtension, size: fileSize});
            }
        });
    }
});

app.post('/upload-video', uploadVideo, function (req, res) {
    console.log(req.body)
    var filesUploaded = 0;
    if (Object.keys(req.files).length === 0) {
        console.log('No files uploaded');
    } else {
        var newName = req.files['my-file'].name;
        var filePath = req.files['my-file'].path;
        var fileExtension = req.files['my-file'].extension;
        var files = req.files.file1;
        var fileSize = req.files['my-file'].size;
        if (!util.isArray(req.files.file1)) {
            files = [req.files.file1];
        }
        filesUploaded = files.length;
        var lastAccessed = Math.floor(Date.now() / 1000);
        var strQuery = "INSERT INTO media( stored_name, path, extension, size, media_type, last_accessed) VALUES ('" + newName + "','uploads/video/" + newName + "','" + fileExtension + "'," + fileSize + ",'video'," + lastAccessed + ")";
        console.log(strQuery);
        con.query(strQuery, function (err, rows) {
            if (err) {
                console.log(err);
                res.json({status: 403, data: 'error occured'});
            }
            else {
                res.json({status: 200, storedName: newName, path: 'uploads/video/' + newName, extension: fileExtension, size: fileSize});
            }
        });
    }
});

app.post('/upload-file', uploadFile, function (req, res) {
    // console.log(req.body)
    var filesUploaded = 0;
    if (Object.keys(req.files).length === 0) {
        console.log('No files uploaded');
    } else {
        var newName = req.files['my-file'].name;
        var filePath = req.files['my-file'].path;
        var fileExtension = req.files['my-file'].extension;
        var files = req.files.file1;
        var fileSize = req.files['my-file'].size;
        if (!util.isArray(req.files.file1)) {
            files = [req.files.file1];
        }
        filesUploaded = files.length;
        res.json({status: 200, storedName: newName, path: filePath, extension: fileExtension, size: fileSize});
    }
});

app.post('/sendContact', contactImage, function (req, res) {
    var output = ''
    console.log(req.files['contact_image'].path);
    console.log(req.body.contact_name);
    console.log(req.body.contact_number);
    var filesUploaded = 0;
    if (Object.keys(req.files).length === 0) {
        console.log('No files uploaded');
        var output = {
            contact_image: "",
            contact_name: req.body.contact_name,
            contact_number: req.body.contact_number
        }
        //get Rx socket id
        res.json(output);
    } else {
        var output = {
            contact_image: req.files['contact_image'].path,
            contact_name: req.body.contact_name,
            contact_number: req.body.contact_number
        }
        res.json(output);
    }
});

app.post('/pinexists', defaultPath, function (req, res) {
   var pin = req.body.pin;
	//res.send(req.body.pin);
	

if ((pin===undefined)||(pin.length === 0)) {
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

app.post('/removemedia', uploadImage, function (req, res) {
    var fs = require('fs');
    var filePath = req.body.filepath;
    console.log("filePath:" + filePath);
    fs.unlink(filePath, function (err) {
        if (err) {
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

app.post('/mediaexists', defaultPath, function (req, res) {
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

app.post('/phonenoexists', defaultPath, function (req, res) {
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

app.listen(3001, function () {
    console.log("Uploader is running on 3001");
});