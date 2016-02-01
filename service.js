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
        res.json({status: 200, storedName: newName, path: filePath, extension: fileExtension, size: fileSize});
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
        res.json({status: 200, storedName: newName, path: filePath, extension: fileExtension, size: fileSize});
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
        res.json({status: 200, storedName: newName, path: filePath, extension: fileExtension, size: fileSize});
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

    if (pin.length === 0) {
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

app.post('/removefile', uploadImage, function (req, res) {
    var fs = require('fs');
    var filePath = req.body.filePath;
    console.log("filePath:" + filePath);
    fs.unlink(filePath, function (err) {
        if (err) {
            res.json({status: 403});
        } else {
            res.json({status: 200});
        }
    });
});


app.listen(3001, function () {
    console.log("Uploader is running on 3001");
});