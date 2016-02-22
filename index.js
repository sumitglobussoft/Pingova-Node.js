/* global require, process */

var express = require('express');
var app = express();
var server = require('http').createServer(app).listen(1234);
var async = require('async');
var io = require('socket.io').listen(server, {
    'heartbeat interval': 5,
    'heartbeat timeout': 10
});
var mysql = require('mysql');
var mongoose = require('mongoose');
var UserSchema = require('./models/userSchema.js');
var MessagequeueSchema = require('./models/messagequeueSchema.js');
var friendRequestSchema = require('./models/friendRequestSchema.js');
// Build the connection string
var dbURI = 'mongodb://localhost/ConnectionTest';

// Create the database connection
mongoose.connect(dbURI);

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function () {
    console.log('Mongoose default connection open to ' + dbURI);
});

// If the connection throws an error
mongoose.connection.on('error', function (err) {
    console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
    console.log('Mongoose default connection disconnected');
});
// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function () {
    mongoose.connection.close(function () {
        console.log('Mongoose default connection disconnected through app termination');
        process.exit(0);
    });
});


var pool = mysql.createPool({
    connectionLimit: 100, //important
    host: 'localhost',
    user: 'pingova',
    password: 'pNUNsGV8KRhPpEfM',
    database: 'pingova',
    debug: false
});

//var pool = mysql.createPool({
//    connectionLimit: 100, //important
//    host: 'localhost',
//    user: 'root',
//    password: 'root',
//    database: 'pingova',
//    debug: false
//});

//var connection = mysql.createConnection({
//		host : "localhost",
//		user : "root",
//		password : "root"
//});
//connection.connect(function(err){
//if(err){
//  console.log('Error connecting to Db');
//  return;
// }
// console.log('Connection established');
//});

//connection.connect();
//connection.query("use pingova");

io.sockets.on('connection', function (client) {
    console.log("client connected: " + client.id);
    io.sockets.socket(client.id).emit("connected", client.id);

    //sends P2P mesagess
    client.on("sendMessage", function (chatMessage) {
        var receivedTime = "" + Math.floor(Date.now() / 1000);
        ///*console.log("Message From: " + chatMessage.fromName);
        // console.log("Message To: " + chatMessage.toName);


        // io.sockets.socket(chatMessage.toClientID).emit("chatMessage", {"fromName" : chatMessage.fromName,
        //"toName" : chatMessage.toName,
        //  "toClientID" : chatMessage.toClientID,
        //  "msg" : chatMessage.msg});*/
        var jsonMsg = JSON.parse(chatMessage);
        jsonMsg.timestamp = receivedTime; //getting the message from client and fetching the json data
        var user = jsonMsg.userto_id;

        //getting the mongo data of the user to whom the message is sent
        UserSchema.find({
            'userId': user
        }, function (err, doc) {
            if (err)
            {
                console.log("error in getting user details");
                return err;
            } else {
                console.log("Length of doc is " + doc.length);
                //save message in the database
                var messagedata = jsonMsg.msg_data;
                console.log(typeof messagedata);
                if ((typeof messagedata) === "object") {
                    //incase the message is in object form converting it to string
                    messagedata = JSON.stringify(messagedata);
                }

                console.log("messagedata:::" + messagedata);
                /*msg_status: {
                 created: null,
                 delivered: int,
                 seen: int
                 },*/
                var newqueuemessage = new MessagequeueSchema({
                    type: 1,
                    userId_to: jsonMsg.userto_id,
                    userId_from: jsonMsg.userfrom_id,
                    msg_type: jsonMsg.msg_type,
                    msg_data: messagedata,
                    msg_status: 1,
                    msg_localid: jsonMsg.msg_local_id,
                    timestamp: receivedTime,
                    msg_serverid: 11
                });
                //saving the message to database
                newqueuemessage.save(function (err) {
                    if (err) {
                        return err;
                    } else {
                        console.log("New message  added in queue !");
                    }
                });
                //if the entered ID exists in mongo DB , this condition will be true and executed
                if (doc.length > 0) {
                    // if user is present, then update his socket id					
                    var socketid = doc[0].socketId;
                    console.log("socket id of opponent " + socketid);
                    if (io.sockets.sockets[socketid] !== undefined)
                    {//user connected to node server
                        io.sockets.socket(socketid).emit("receivemessage", JSON.stringify(jsonMsg));
                    } else//When user is not connected to node server
                    {
                        console.log("Socket not connected");
                        var myarr = '{"message_local_id":"' + jsonMsg.msg_local_id + '","status":"1","userid_to":"' + jsonMsg.userto_id + '","timestamp":"' + receivedTime + '"}';
                        // io.sockets.socket(client.id).emit("messagestatus", myarr);
                        if (io.sockets.socket(client.id) !== undefined)
                        {
                            console.log("**socket id is valid for sending message user**");
                            io.sockets.socket(client.id).emit("messagestatus", myarr);
                        } else
                        {
                            console.log("**socket id is not valid for sending message user**");
                            var newqueuemessage = new MessagequeueSchema({
                                type: 2,
                                userId_to: jsonMsg.userfrom_id,
                                to_send: jsonMsg.userto_id,
                                msg_localid: jsonMsg.msg_local_id,
                                msg_serverid: 11,
                                msg_status: 1, //message not delivered to user
                                timestamp: receivedTime
                            });
                            newqueuemessage.save(function (err) {
                                if (err) {
                                    return err;
                                } else {
                                    console.log("New message  added in queue !");
                                }
                            });
                        }
                    }
                } else//when doc get from mongadb length is less that 0
                {
                    console.log("Socket not connected");
                    var myarr = '{"message_local_id":"' + jsonMsg.msg_local_id + '","status":"1","userid_to":"' + jsonMsg.userto_id + '","timestamp":"' + receivedTime + '"}';
                    // io.sockets.socket(client.id).emit("messagestatus", myarr);
                    if (io.sockets.socket(client.id) !== undefined)
                    {
                        console.log("**socket id is valid for sending message user**");
                        io.sockets.socket(client.id).emit("messagestatus", myarr);
                    } else
                    {
                        console.log("**socket id is not valid for sending message user**");
                        var newqueuemessage = new MessagequeueSchema({
                            type: 2,
                            userId_to: jsonMsg.userfrom_id,
                            to_send: jsonMsg.userto_id,
                            msg_localid: jsonMsg.msg_local_id,
                            msg_serverid: 11,
                            msg_status: 1,
                            timestamp: receivedTime
                        });
                        newqueuemessage.save(function (err) {
                            if (err) {
                                return err;
                            } else {
                                console.log("New message  added in queue !");
                            }
                        });
                    }
                }
            }
        });
    });

    //get the delivered status
    client.on("receivedMessageStatus", function (msg) {
        var receivedTime = "" + Math.floor(Date.now() / 1000);
        console.log("=====================receivedMessageStatus=========================" + msg);
        var jsonMsg = JSON.parse(msg);
        jsonMsg.timestamp = jsonMsg;
        var user = jsonMsg.userfrom_id;
        console.log("=====================user=========================" + user);
        console.log("sentby_user_id" + jsonMsg.sentby_user_id);
        if (jsonMsg.sentby_user_id !== undefined) {
            user = jsonMsg.sentby_user_id;
        }

        UserSchema.find({
            'userId': user
        }, function (err, doc) {
            if (err)
            {
                console.log("error in getting user details");
                return err;
            } else {
                if (doc.length > 0) {

                    var socketid = doc[0].socketId;
                    var myarr = '{"message_local_id":"' + jsonMsg.msg_local_id + '","status":"' + jsonMsg.msg_status + '","userid_to":"' + jsonMsg.userto_id + '","timestamp":"' + receivedTime + '"}';
                    console.log("myarr::::::::" + myarr);
                    // io.sockets.socket(client.id).emit("messagestatus", myarr);
                    if (jsonMsg.type === 1) {
                        if (io.sockets.sockets[socketid] !== undefined)
                        {
                            console.log("**socket id is valid for sending message user**");
                            io.sockets.socket(socketid).emit("messagestatus", myarr);
                        } else
                        {
                            console.log("**socket id is not valid for sending message user**");
                            var newqueuemessage = new MessagequeueSchema({
                                type: 2,
                                userId_to: user,
                                to_send: jsonMsg.userto_id,
                                msg_localid: jsonMsg.msg_local_id,
                                msg_serverid: 11,
                                msg_status: jsonMsg.msg_status,
                                timestamp: receivedTime
                            });
                            newqueuemessage.save(function (err) {
                                if (err) {
                                    return err;
                                } else {
                                    console.log("New message status added in queue !");
                                }
                            });
                        }
                    }
                    var messagedata = jsonMsg.msg_data;
                    console.log(typeof messagedata);
                    if ((typeof messagedata) === "object") {
                        messagedata = JSON.stringify(messagedata);
                    }

                    MessagequeueSchema.find({
                        userId_to: jsonMsg.userto_id,
                        userId_from: jsonMsg.userfrom_id,
                        msg_type: jsonMsg.msg_type,
//                        msg_data: messagedata,
                        msg_localid: jsonMsg.msg_local_id
                    }, function (err, docs) {
                        docs.forEach(function (doc) {
                            doc.remove();
                        });
                    });
                }
            }
        });
    });

    //checking user is using pingova or not
    client.on("checkContactUser", function (msg) {
        var jsonMsg = JSON.parse(msg);
        pool.getConnection(function (err, connection) {
            if (err)
            {
                connection.release();
                return;
            }
            var strQuery = "SELECT * FROM 'User' WHERE phoneno=" + jsonMsg.phone_no;
            connection.query(strQuery, function (err, rows) {
                if (err) {
                    throw err;
                } else {
                    console.log(rows);
                }
            });
        });
    });

    //to check if the no.s sent are in pingova n if so update contact
    client.on("updatecontact", function (msg)
    {
        pool.getConnection(function (err, connection) {
            if (err)
            {
                connection.release();
                return;
            }
            var Query = "SELECT * FROM users WHERE phone_no IN " + msg;
            console.log(Query);
            connection.query(Query, function (err, rows) {
                if (err) {
                    throw err;
                } else
                {
                    io.sockets.socket(client.id).emit("updatecontactResponse", rows);
                }
            });
        });
    });

    client.on("checkSequence", function (msg)
    {
        var jsonMsg = JSON.parse(msg);
        pool.getConnection(function (err, connection) {
            if (err) {
                connection.release();
                return;
            }
            var Query = "SELECT * FROM users WHERE userid=" + jsonMsg.userid;
            connection.query(Query, function (err, rows)
            {
                connection.release();
                if (!err)
                {
                    console.log("lenght of row  " + rows.length);
                    if (rows.length > 0)
                    {
                        var sequencecheck = rows[0].contact_sequence;
                        console.log(sequencecheck);
                        console.log(jsonMsg.sequence);
                        if (sequencecheck === jsonMsg.sequence)
                        {
                            io.sockets.socket(client.id).emit("checkSequenceResponse", true);
                        } else
                        {
                            io.sockets.socket(client.id).emit("checkSequenceResponse", false);
                        }
                        console.log(rows);
                    } else
                    {
                        console.log("user dont have data in my sql");
                    }
                }
            });
        });
    });

    //when a user connects to the sockets it hits this service. and here in this event we get all the pending messages 
    client.on("checkStatus", function (msg) {
        var jsonMsg1 = JSON.parse(msg);
        var receivedTime = "" + Math.floor(Date.now() / 1000);
        console.log("@@@@@@@@@@@@@@@" + jsonMsg1.userId);
        console.log("@@@@@@@@@@@@@@@" + jsonMsg1.sequence);
        var strQuery = "SELECT * FROM users WHERE userid=" + jsonMsg1.userId;
        //Getting connection from pool
        pool.getConnection(function (err, connection) {
            if (err) {
                connection.release();
                return;
            }
            connection.query(strQuery, function (err, rows) {
                connection.release();
                if (!err)
                {
                    var sequencecheck = rows[0].contact_sequence;
                    if (sequencecheck === jsonMsg1.sequence)//Checking sequence is ok or not
                    {
                        //io.sockets.socket(client.id).emit("checkSequenceResponse", true);
                        var userid = jsonMsg1.userId;
                        var socketId = jsonMsg1.socketId;
                        UserSchema.find({
                            'userId': userid
                        }, function (err, doc) {
                            if (err) {
                                return err;
                            } else {
                                console.log("Length of doc is " + doc.length);
                                if (doc.length > 0) {
                                    // if user is present, then update his socket id
                                    doc[0].socketId = socketId;
                                    doc[0].save();
                                    console.log("socket Id has been updated for user " + userid + "with a new socket Id: " + socketId);
                                    console.log(doc);
                                } else {
                                    //we will add a new user here
                                    var newUser = new UserSchema({
                                        userId: userid,
                                        socketId: socketId,
                                        lastseen: 0
                                    });
                                    newUser.save(function (err) {
                                        if (err) {
                                            return err;
                                        } else {
                                            console.log("New user added !");
                                        }
                                    });
                                }
                            }
                        });
                        //).sort({'timestamp': -1}
                        MessagequeueSchema.find({
                            'userId_to': userid
                        }).sort({'timestamp': 1}).exec(function (err, doc)
                        {
                            if (err)
                            {
                                console.log("ERROR IN GETTING QUEUQ MSG");
                            } else
                            {
                                console.log("count  of queue msg document " + doc.length);
                                if (doc.length > 0)
                                {
                                    var messagearray = {
                                        message: []
                                    };
                                    var objIds = [];
                                    //MessagequeueSchema.remove({_id:{$in:objIds}});

                                    async.forEachSeries(doc, function (item, callback)
                                    {
                                        console.log("****************************************");
                                        console.log(item);
                                        objIds.push(item._id);
                                        if (item.type === 1)
                                        {
                                            messagearray.message.push({
                                                "userid_to": item.userId_to,
                                                "type": item.type,
                                                "userid_from": item.userId_from,
                                                "msg_type": item.msg_type,
                                                "msg_data": item.msg_data,
                                                "msg_local_id": item.msg_localid,
                                                "contact_name": item.contact_name,
                                                "contact_number": item.contact_number,
                                                "contact_image": item.contact_image,
                                                "timestamp": item.timestamp,
                                                "msg_server_id": item.msg_serverid
                                            });
                                            var messagestatusarray = {messagestatus: []};
                                            messagestatusarray.messagestatus.push({
                                                "userid_to": item.to_send,
                                                "msg_serverid": 11,
                                                "msg_local_id": item.msg_localid,
                                                "msg_status": 2
                                            });
                                            var userid_to = item.userId_to;
                                            var localid = item.msg_localid;
                                            var useridfrom = item.userId_from;
                                            // console.log("***************************")
                                            // console.log(localid);
                                            //Getting Socket id of user whom we have to send mesage status
                                            UserSchema.find({
                                                'userId': item.userId_from
                                            }, function (err, doc) {
                                                if (err)
                                                {
                                                } else
                                                {
                                                    if (doc.length > 0)
                                                    {
                                                        var socketid = doc[0].socketId;
                                                        if (io.sockets.sockets[socketid] !== undefined)
                                                        {
                                                            var myarr = '{"message_local_id":"' + localid + '","status":"2","userid_to":"' + userid_to + '","timestamp":"' + receivedTime + '"}';
                                                            io.sockets.socket(socketid).emit("messagestatus", myarr);
                                                        } else
                                                        {
                                                            var newqueuemessage = new MessagequeueSchema({
                                                                type: 2,
                                                                userId_to: useridfrom,
                                                                to_send: userid_to,
                                                                msg_localid: localid,
                                                                msg_serverid: 11,
                                                                timestamp: receivedTime,
                                                                msg_status: 2
                                                            });
                                                            newqueuemessage.save(function (err) {
                                                                if (err) {
                                                                    return err;
                                                                } else {
                                                                    console.log("New message  added in queue !");
                                                                }
                                                            });
                                                        }
                                                    }
                                                }
                                            });
                                        } else
                                        {
                                            if (item.type === 2)//message status
                                            {
                                                messagearray.message.push({
                                                    "type": 2,
                                                    "userid_to": item.to_send,
                                                    "msg_local_id": item.msg_localid,
                                                    "msg_server_id": item.msg_serverid,
                                                    "timestamp": item.timestamp,
                                                    "msg_status": item.msg_status
                                                });
                                            }
                                            else if (item.type === 3) {//group creation notification

                                                messagearray.message.push({
                                                    "type": 3,
                                                    "userid_to": item.userId_to,
                                                    "msg_server_id": item.msg_serverid,
                                                    "msg_data": item.msg_data,
                                                    "timestamp": item.timestamp
                                                });
                                            }
                                            /***************************************/
                                            else if (item.type === 4) {//group messages 
                                                messagearray.message.push({
                                                    "userid_to": item.userId_to,
                                                    "type": item.type,
                                                    "userid_from": item.userId_from,
                                                    "msg_type": item.msg_type,
                                                    "msg_data": item.msg_data,
                                                    "msg_local_id": item.msg_localid,
                                                    "contact_name": item.contact_name,
                                                    "contact_number": item.contact_number,
                                                    "contact_image": item.contact_image,
                                                    "sentby_user_id": item.send_by,
                                                    "timestamp": item.timestamp,
                                                    "msg_server_id": item.msg_serverid
                                                });
//                                            var messagestatusarray = {messagestatus: []};
//                                            messagestatusarray.messagestatus.push({
//                                                "userid_to": item.to_send,
//                                                "msg_serverid": 11,
//                                                "msg_local_id": item.msg_localid,
//                                                "msg_status": 2
//                                            });
                                                /*notification status
                                                 var userid_to = item.userId_to;
                                                 var localid = item.msg_localid;
                                                 var useridfrom = item.userId_from;
                                                 // console.log("***************************")
                                                 // console.log(localid);
                                                 //Getting Socket id of user whom we have to send mesage status
                                                 UserSchema.find({
                                                 'userId': item.send_by
                                                 }, function (err, doc) {
                                                 if (err)
                                                 {
                                                 } else
                                                 {
                                                 if (doc.length > 0)
                                                 {
                                                 var socketid = doc[0].socketId;
                                                 if (io.sockets.sockets[socketid] !== undefined)
                                                 {
                                                 var myarr = '{"message_local_id":"' + localid + '","status":"2","userid_to":"' + userid_to + '"}';
                                                 io.sockets.socket(socketid).emit("messagestatus", myarr);
                                                 } else
                                                 {
                                                 var newqueuemessage = new MessagequeueSchema({
                                                 type: 2,
                                                 userId_to: item.send_by,
                                                 to_send: userid_to,
                                                 msg_localid: localid,
                                                 msg_serverid: 11,
                                                 msg_status: 2
                                                 });
                                                 newqueuemessage.save(function (err) {
                                                 if (err) {
                                                 return err;
                                                 } else {
                                                 console.log("New message  added in queue !");
                                                 }
                                                 });
                                                 }
                                                 }
                                                 }
                                                 });  notification*/
                                            }
                                            else if (item.type === 5) { //leave group
                                                messagearray.message.push({
                                                    "userid_to": item.userId_to,
                                                    "type": item.type,
                                                    "userid_from": item.userId_from,
                                                    "sentby_user_id": item.send_by,
                                                    "timestamp": item.timestamp,
                                                    "msg_data": item.msg_data
                                                });
                                            }
                                            else if (item.type === 6) {//remove members from group
                                                messagearray.message.push({
                                                    "userid_to": item.userId_to,
                                                    "type": item.type,
                                                    "group_id": item.userId_from,
                                                    "moderator_id": item.send_by,
                                                    "timestamp": item.timestamp,
                                                    "user_id": item.msg_data
                                                });
                                            }
                                            else if (item.type === 7) {//add members to group
                                                var jsonmsg_data = JSON.parse(item.msg_data);
                                                messagearray.message.push({
                                                    "userid_to": item.userId_to,
                                                    "type": item.type,
                                                    "group_id": item.userId_from,
                                                    "moderatorId": item.send_by,
                                                    "timestamp": item.timestamp,
                                                    "user_data": jsonmsg_data
                                                });
                                            }
                                            else if (item.type === 8) {//join group request
                                                var jsonmsg_data = JSON.parse(item.msg_data);
                                                messagearray.message.push({
                                                    "moderatorId": item.userId_to,
                                                    "type": item.type,
                                                    "groupId": item.userId_from,
                                                    "sentby_user_id": item.send_by,
                                                    "timestamp": item.timestamp,
                                                    "user_data": jsonmsg_data
                                                });
                                            }
                                            else if (item.type === 9) {//member accepted notification to all
                                                var jsonmsg_data = JSON.parse(item.msg_data);
                                                messagearray.message.push({
                                                    "userid_to": item.userId_to,
                                                    "type": item.type,
                                                    "group_id": item.userId_from,
                                                    "moderator_id": item.send_by,
                                                    "timestamp": item.timestamp,
                                                    "user_data": jsonmsg_data
                                                });
                                            }
                                            else if (item.type === 10) {//accepted request notification to requested user
                                                messagearray.message.push({
                                                    "userid_to": item.userId_to,
                                                    "type": item.type,
                                                    "userid_from": item.userId_from,
                                                    "sentby_user_id": item.send_by,
                                                    "timestamp": item.timestamp,
                                                    "msg_data": item.msg_data
                                                });
                                            }
                                            else if (item.type === 11) {//group addition notification to added member

                                                messagearray.message.push({
                                                    "type": 11,
                                                    "userid_to": item.userId_to,
                                                    "msg_server_id": item.msg_serverid,
                                                    "msg_data": item.msg_data,
                                                    "timestamp": item.timestamp
                                                });
                                            }
                                            else if (item.type === 12) {//account deletion notification

                                                messagearray.message.push({
                                                    "type": 12,
                                                    "userid_to": item.userId_to,
                                                    "msg_server_id": item.msg_serverid,
                                                    "timestamp": item.timestamp
                                                });
                                            }
                                        }
                                        callback();
                                    }, function () {
                                        io.sockets.socket(client.id).emit("pendingmessage", messagearray);
                                        //MessagequeueSchema.remove({_id:{$in:objIds}});
                                        //doc[0].socketId = socketId;
                                        //doc[0].save();
                                        //console.log("socket Id has been updated for user " + userid + "with a new socket Id: " + socketId);
                                        MessagequeueSchema.find({_id: {$in: objIds}}, function (err, docs) {
                                            docs.forEach(function (doc) {
                                                doc.remove();
                                            });
                                        });
                                    });
                                } else
                                {
                                    console.log("size of documnet is less that zero " + doc.length);
                                }
                            }

                        });
                        //friend requests
                        friendRequestSchema.find({
                            'status': 0,
                            'friendUserId': userid
                        }, function (err, doc)
                        {
                            if (err)
                            {
                                console.log("ERROR IN GETTING pendingfriendrequest");
                            } else
                            {
                                console.log("count  of queue msg document " + doc.length);
                                if (doc.length > 0)
                                {
                                    var friendrequestarray = {
                                        friendrequest: []
                                    };
                                    async.forEachSeries(doc, function (item, callback)
                                    {
                                        console.log("****************************************");
                                        friendrequestarray.friendrequest.push({
                                            "userid_to": item.friendUserId,
                                            "userid_from": item.userId,
                                            "status": item.status
                                        });
                                        callback();
                                    }, function () {
                                        io.sockets.socket(client.id).emit("receiveFriendRequest", friendrequestarray);
                                    });
                                } else
                                {
                                    console.log("size of documnet is less that zero " + doc.length);
                                }
                            }
                        });
                    } else//if sequence is changes 
                    {
                        io.sockets.socket(client.id).emit("SequenceCheck", false);
                    }
                }
            });
        });
    });

    client.on("getContactDetails", function (msg) {
        var user_data = {};
        //var contact = JSON.parse(msg);
        console.log(" user id get from local user  " + msg);
        var Query = "SELECT * FROM users WHERE userid=" + msg;
        pool.getConnection(function (err, connection) {
            if (err) {
                connection.release();
                return;
            }
            connection.query(Query, function (err, rows) {
                connection.release();
                if (!err)
                {

                    if (rows.length > 0) {
                        user_data.user_id = rows[0].userid;
                        user_data.pin_no = rows[0].pin_no;
                        user_data.contact_displayname = rows[0].contact_displayname;
                        user_data.contact_status = rows[0].contact_status;
                        user_data.contact_gender = rows[0].contact_gender;
                        user_data.contact_profilepic = rows[0].contact_profilepic;
                        user_data.contact_profilepicthumb = rows[0].contact_profilepicthumb;
                        user_data.contact_isnovisible = rows[0].contact_isnovisible;
                        user_data.contact_isgroup = rows[0].contact_isgroup;
                    }

                    io.sockets.socket(client.id).emit("getContactDetailsResponse", user_data);
                }
            });
        });
    });

    client.on("sendReadReport", function () {
    });

    // the event is hit when user disconnects from the socket
    client.on("disconnect", function () {
        var lastseen = Math.floor(Date.now() / 1000);
        //gets the current time in secs
        console.log("=================================>" + lastseen);
        UserSchema.find({
            'socketId': client.id
        }, function (err, doc) {
            if (err) {
                return err;
            } else {
                if (doc.length > 0) {
                    doc[0].lastseen = lastseen;
                    doc[0].isOnline = 0;
                    doc[0].save(); //updates the DB with offline and time
                }
            }
        });
        console.log("client ID: " + client.id + ' has disconnected from the chat server.');
        UserSchema.find({}, function (err, doc) {
            if (err) {
                return "disconnect";
            } else {
                console.log("Total number of users present :" + doc.length);
                console.log("Displaying all documents in the user collection:" + doc);
            }
        });
    });

    //to run when user closes the application but application will run in back ground
    client.on("applicationInBackground", function () {
        var lastseen = Math.floor(Date.now() / 1000);
        console.log("=================================>" + lastseen);
        UserSchema.find({
            'socketId': client.id
        }, function (err, doc) {
            if (err) {
                console.log("ERROR: Not able to update last seen");
                return err;
            } else {
                if (doc.length > 0) {
                    doc[0].lastseen = lastseen;
                    doc[0].save();
                }
            }
        });
    });

    //searching the user by pin
    client.on("searchUserPin", function (msg) {
        pool.getConnection(function (err, connection) {
            if (err)
            {
                connection.release();
                return;
            }
            var jsonMsg = JSON.parse(msg);
            var strQuery = "SELECT * FROM users WHERE pin_no like '%" + jsonMsg.pin_no + "%'";
            console.log(strQuery);
            connection.query(strQuery, function (err, rows) {
                if (err) {
                    throw err;
                } else {

                    if (rows.length > 0) {

                        io.sockets.socket(client.id).emit("searchUserPinResponse", rows);
                    } else {

                        io.sockets.socket(client.id).emit("searchUserPinResponse", rows);
                    }
                }
            });
        });
    });

//checking if user online
    client.on("searchUserOnline", function (msg) {
        var jsonMsg = JSON.parse(msg);
        var user = jsonMsg.user_id;
        UserSchema.find({
            'userId': user
        }, function (err, doc) {
            if (err)
            {
                console.log("error in getting user details");
                return err;
            } else {
                var myarr = '{"online_status":"0","user_id":"' + user + '"}';
                if (doc.length > 0) {
                    var socketid = doc[0].socketId;
                    if (io.sockets.sockets[socketid] !== undefined)
                    {
                        if (doc[0].isOnline === 1) {
                            myarr = '{"online_status":"1","user_id":"' + user + '"}';
                        }
                        else {
                            myarr = '{"online_status":"0","last_seen":"' + doc[0].lastseen + '","user_id":"' + user + '"}';
                        }

                        io.sockets.socket(client.id).emit("userOnlineStatus", myarr);
                    }
                    else {
                        myarr = '{"online_status":"0","last_seen":"' + doc[0].lastseen + '","user_id":"' + user + '"}';
                        io.sockets.socket(client.id).emit("userOnlineStatus", myarr);
                    }
                } else {

                    io.sockets.socket(client.id).emit("userOnlineStatus", myarr);
                }
            }
        });
    });

    //get the typing status
    client.on("sendTypingStatus", function (msg) {
        var jsonMsg = JSON.parse(msg);
        var user = jsonMsg.userto_id;
        UserSchema.find({
            'userId': user
        }, function (err, doc) {
            if (err)
            {
                console.log("error in getting user details");
                return err;
            } else {
                if (doc.length > 0) {

                    var socketid = doc[0].socketId;
                    if (io.sockets.socket(socketid) !== undefined)
                    {
                        console.log("**socket id is valid for sending message user**");
                        io.sockets.socket(socketid).emit("typingStatus", msg);
                    }
                }
            }
        });
    });

    //updating status
    client.on("updateContactStatus", function (msg) {
        var jsonMsg = JSON.parse(msg);
        var user = jsonMsg.user_id;
        var contactStatus = jsonMsg.contact_status;
        pool.getConnection(function (err, connection) {
            if (err)
            {
                console.log(err);
                connection.release();
                return;
            }
            var strQuery = "UPDATE users SET contact_status ='" + contactStatus + "' WHERE userid = " + user;
            console.log(strQuery);
            connection.query(strQuery, function (err, rows) {
                if (err) {
                    console.log(err);
//                    throw err;
                } else {
                    var myarr;
                    console.log(rows);
                    console.log(rows.affectedRows);
                    if (rows.affectedRows > 0) {
                        myarr = '{"updated_status":"1"}';
                    } else {
                        myarr = '{"updated_status":"0"}';
                    }
                    io.sockets.socket(client.id).emit("updateContactStatusResponse", myarr);
                }
            });
        });
    });

    //Make mobile number visible/invisible to contact
    client.on("mobileNumberVisibility", function (msg) {
        var jsonMsg = JSON.parse(msg);
        var user = jsonMsg.user_id;
        var numberVisibility = jsonMsg.numberVisibility; //0 not visible  1 visible

        pool.getConnection(function (err, connection) {
            if (err)
            {
                console.log(err);
                connection.release();
                return;
            }

            var strQuery = "UPDATE users SET contact_isnovisible =" + numberVisibility + " WHERE userid = " + user;
            console.log(strQuery);
            connection.query(strQuery, function (err, rows) {
                if (err) {
                    console.log(err);
                    throw err;
                } else {
                    console.log(rows);
                }
            });
        });
    });

    //sending friend request
    client.on("sendFriendRequest", function (data) {

        var jsonMsg = JSON.parse(data);
        var userfrom_id = jsonMsg.userfrom_id; // req. sending user.
        var userto_id = jsonMsg.userto_id; // req. receiving user.
        var request_status = jsonMsg.status; // 0 for send req. and 3 for cancel req 

        UserSchema.find({
            'userId': userto_id
        }, function (err, doc1) {
            if (err)
            {
                console.log("error in getting user details");
                return err;
            } else {
                if (doc1.length > 0) {
                    friendRequestSchema.find({$or: [{
                                'userId': userfrom_id,
                                'friendUserId': userto_id
                            }, {
                                'userId': userto_id,
                                'friendUserId': userfrom_id
                            }]}, function (err, doc) {
                        if (err)
                        {

                        } else {
                            if (doc.length > 0) {
//                                var myarr = '{"request_status":"' + 3 + '"}';//already request sent or received
                                if (request_status === '1') {
                                    doc[0].request_status = request_status;
                                    doc[0].save();
                                }
                                //io.sockets.socket(client.id).emit("receiveFriendStatus", doc[0]);
                            }
                            else {

                                var friendrequestqueue = new friendRequestSchema({
                                    userId: userfrom_id,
                                    friendUserId: userto_id,
                                    status: request_status
                                });
                                friendrequestqueue.save(function (err) {
                                    if (err) {
                                        console.log("Error in saving friend request!");
                                        return err;
                                    } else {
                                        console.log("friend request added in queue !");
                                        var socketid = doc1[0].socketId;
                                        // io.sockets.socket(client.id).emit("messagestatus", myarr);
                                        if (io.sockets.sockets[socketid] !== undefined)
                                        {
                                            console.log("**socket id is valid for sending message user**");
                                            var friendrequestarray = {
                                                friendrequest: []
                                            };
                                            friendrequestarray.friendrequest.push({
                                                "userid_to": userto_id,
                                                "userid_from": userfrom_id,
                                                "status": request_status
                                            });
                                            console.log("****receiveFriendRequest****");
                                            io.sockets.socket(socketid).emit("receiveFriendRequest", friendrequestarray);
                                        } else
                                        {
                                            console.log("**socket id is not valid for sending message user**");
                                        }
                                    }
                                });
                            }
                        }
                    });
                }
                else {
                    //  var myarr = '{"request_status":"' + 4 + '"}';//friend not present
                    // io.sockets.socket(client.id).emit("receiveFriendStatus", myarr);
                }
            }
        });
    });

    //accept or reject friends request
    client.on("acceptRejectFriendRequest", function (data) {

        var jsonMsg = JSON.parse(data);
        var userfrom_id = jsonMsg.userfrom_id; // req. sending user.
        var userto_id = jsonMsg.userto_id; // req. receiving user.
        var request_status = jsonMsg.status; // 1 for reject req and 2 accept and 3 cancle

        UserSchema.find({
            'userId': userfrom_id
        }, function (err, doc1) {
            if (err)
            {
                console.log("error in getting user details");
                return err;
            } else {
                if (doc1.length > 0) {
                    friendRequestSchema.find({
                        'userId': userfrom_id,
                        'friendUserId': userto_id
                    }, function (err, doc) {
                        if (err)
                        {

                        } else {
                            if (doc.length > 0) {
                                console.log("++++++++++++request_status+++++++++++++++");
                                doc[0].status = request_status;
                                doc[0].save();
                            }
                            else {
                                console.log("++++++++++++in else 1+++++++++++++++");
                            }
                        }
                    });
                }
                else {
                    console.log("++++++++++++in else 2+++++++++++++++");
                }
            }
        });
    });

    //Creating the group
    client.on("createGroup", function (msg) {
        var receivedTime = Math.floor(Date.now() / 1000);
        var jsonMsg = JSON.parse(msg);
        var groupId = jsonMsg.group_id;
        var arrayGroupMembers = jsonMsg.array_group_members;
        var userId = jsonMsg.user_id;
        var group_members_list = [];
        var groupmembesdata;
        pool.getConnection(function (err, connection) {
            if (err)
            {
                console.log(err);
                connection.release();
                return;
            }
            //saving creating group info to user table
            var strQuery = "SELECT * FROM users WHERE userId = " + groupId + " and contact_isgroup=1";
            console.log(strQuery);
            connection.query(strQuery, function (err, groupDataRow) {
                if (err) {
                    console.log(err);
                    //throw err;
                } else {
                    if (groupDataRow.length > 0)
                    {
                        //adding  Group Created Time
                        var addGroupCreatedTime = "UPDATE users SET created_time =" + receivedTime + ", created_by =" + userId + " where userid =" + groupId;
                        console.log(addGroupCreatedTime);
                        connection.query(addGroupCreatedTime);
                        //fetching group members data
                        var strQuery = "SELECT * FROM users WHERE userid in (" + arrayGroupMembers + ")";
                        console.log("========>" + strQuery);
                        connection.query(strQuery, function (err, item) {
                            if (err) {
                                console.log(err);
                                throw err;
                            } else {

                                async.forEachSeries(item, function (member, callback)
                                {
                                    console.log("inside adding group data");
                                    var group_members_data = {};
                                    group_members_data.user_id = member.userid;
                                    group_members_data.pin_no = member.pin_no;
                                    group_members_data.contact_displayname = member.contact_displayname;
                                    group_members_data.contact_status = member.contact_status;
                                    group_members_data.contact_gender = member.contact_gender;
                                    group_members_data.contact_profilepic = member.contact_profilepic;
                                    group_members_data.contact_profilepicthumb = member.contact_profilepicthumb;

                                    group_members_list.push(group_members_data);
                                    callback();
                                }, function () {
                                    groupmembesdata = JSON.stringify(group_members_list);
                                    //saving all the group members data
                                    async.forEachSeries(arrayGroupMembers, function (user, callback)
                                    {
                                        UserSchema.find({
                                            'userId': user
                                        }, function (err, doc) {
                                            if (err) {
                                                console.log("::::::::::::err:::::::::::::" + err);
                                            }
                                            else {
                                                console.log(doc.length + "::::::::::::no err in searching users:::::::::::::" + user);
                                                if (doc.length > 0) {
                                                    console.log("::::");
                                                    var groupmenbersocketId = doc[0].socketId;
                                                    console.log("*****************item***********************" + user);
                                                    var strQueryGroupMembers = "INSERT INTO groupusers SET group_id =" + groupId + " , user_id =" + user + ", is_moderator=0, request_status=1";
                                                    if ("" + user === userId) {
                                                        strQueryGroupMembers = "INSERT INTO groupusers SET group_id =" + groupId + " , user_id =" + user + ", is_moderator=1, request_status=1";
                                                    }
                                                    console.log(strQueryGroupMembers);
                                                    connection.query(strQueryGroupMembers, function (err, row) {
                                                        if (err) {
                                                            console.log(err);
//                                                        throw err;
                                                        } else {
                                                            var typeCheck;
                                                            var groupCreationData = '{"group_name":"' + groupDataRow[0].contact_displayname + '","group_id":"' + groupId + '","group_pin":"' + groupDataRow[0].pin_no + '","group_profilepic":"' + groupDataRow[0].contact_profilepic + '","group_profilepicthumb":"' + groupDataRow[0].contact_profilepicthumb + '","group_isvisible":"' + groupDataRow[0].contact_isnovisible + '","group_timestamp":"' + receivedTime + '","group_created_by":"' + userId + '","moderator_id":"' + userId + '","timestamp":"' + receivedTime + '","arrayGroupMembers":' + groupmembesdata + '}';
                                                            if (io.sockets.sockets[groupmenbersocketId] !== undefined)
                                                            {
                                                                console.log("**socket id is valid for sending message user**");
                                                                if ("" + user === userId) {
                                                                    typeCheck = 3;
                                                                    io.sockets.socket(groupmenbersocketId).emit("groupCreation", groupCreationData);
                                                                }
                                                                else {
                                                                    typeCheck = 11;
                                                                    io.sockets.socket(groupmenbersocketId).emit("groupAddition", groupCreationData);
                                                                }
                                                            }
                                                            else {
                                                                if ((typeof groupCreationData) === "object")
                                                                {
                                                                    groupCreationData = JSON.stringify(groupCreationData);
                                                                }
                                                                var newqueuemessage = new MessagequeueSchema({
                                                                    type: typeCheck,
                                                                    userId_to: user,
                                                                    userId_from: groupId,
                                                                    msg_data: groupCreationData,
                                                                    timestamp: receivedTime,
                                                                    msg_serverid: 11
                                                                });
                                                                newqueuemessage.save(function (err) {
                                                                    if (err) {
                                                                        return err;
                                                                    } else {
                                                                        console.log("New message  added in queue !");
                                                                    }
                                                                });
                                                            }
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                        callback();
                                    }, function () {
                                        // io.sockets.socket(client.id).emit("receiveFriendRequest", friendrequestarray);
                                    });
                                });
                            }
                        });
                    }
                    else {
                        io.sockets.socket(client.id).emit("groupCreation", "invalid groupID");
                    }
                }
            });
        });
    });

    //sending Message To the Group
    client.on("sendMessageToGroup", function (groupMsg) {
        var receivedTime = "" + Math.floor(Date.now() / 1000);
        var jsonGroupMsg = JSON.parse(groupMsg);
        var groupId = jsonGroupMsg.userto_id; //group id
        var userIdFrom = jsonGroupMsg.userfrom_id;
        var msgData = jsonGroupMsg.msg_data;
        var msgType = jsonGroupMsg.msg_type;
        var isGroup = 1;
        var sentBy = jsonGroupMsg.userfrom_id;
        var msgLocalId = jsonGroupMsg.msg_local_id;
        pool.getConnection(function (err, connection) {
            if (err)
            {
                console.log(err);
                connection.release();
                return;
            }

            var strQuery = "SELECT * FROM groupusers WHERE group_id = " + groupId + " and request_status = 1";
            console.log(strQuery);
            connection.query(strQuery, function (err, rows) {
                if (err) {
                    console.log(err);
                    throw err;
                } else {
                    console.log(rows);
                    if (rows.length > 0) {
                        async.forEachSeries(rows, function (item, callback)
                        {
                            console.log("****************************************");
                            console.log("****************" + item + "****************");
                            //{"msg_local_id":"70","userfrom_id":"131","userto_id":"132","msg_type":"0","msg_data":"hello"}
                            // var jsonData = '{"msg_local_id":"' + msgLocalId + '","msg_type":"' + msgType + '","msg_data":"' + msgData + '","userfrom_id":"' + groupId + '","userto_id":"' + item.user_id + '","sentby_user_id":"' + sentBy + '"}';

                            var jsonData = {};
                            jsonData.msg_local_id = msgLocalId;
                            jsonData.msg_type = msgType;
                            jsonData.msg_data = msgData;
                            jsonData.userfrom_id = groupId;
                            jsonData.userto_id = item.user_id;
                            jsonData.sentby_user_id = sentBy;
                            jsonData.timestamp = receivedTime;
                            //send to each  
                            //to will be user from will by group sent by will be from user id message 
                            //ack will be given to received user
                            console.log(item.user_id + "***************1****************" + sentBy);
                            if ((item.user_id + "") !== sentBy) {
                                console.log(item.user_id + "***************2****************" + sentBy);
                                sendGroupMessageFun(jsonData);
                            }
                            callback();
                        }, function () {
                        });
                    }
                }
            });
        });
    });

    //sending message to group function
    var sendGroupMessageFun = function (groupMessage) {
        console.log("groupMessage::::::::::::::::::::::::::::" + groupMessage);
        var test = JSON.stringify(groupMessage);
        console.log("test::::::::::::::::::::::::::::" + test);
        var jsonMsg = JSON.parse(test);
        console.log("jsonMsg::::::::::::::::::::::::::::" + jsonMsg);
        var user = jsonMsg.userto_id;
        UserSchema.find({
            'userId': user
        }, function (err, doc) {
            if (err)
            {
                console.log("error in getting user details");
                return err;
            } else {
                console.log("Length of doc is " + doc.length);
                //save message in the database
                var messagedata = jsonMsg.msg_data;
                console.log(typeof messagedata);
                if ((typeof messagedata) === "object")
                {
                    messagedata = JSON.stringify(messagedata);
                }

                console.log("messagedata::::::::" + messagedata);

                var newqueuemessage = new MessagequeueSchema({
                    type: 4,
                    userId_to: jsonMsg.userto_id,
                    userId_from: jsonMsg.userfrom_id,
                    msg_type: jsonMsg.msg_type,
                    msg_data: messagedata,
                    msg_status: 1,
                    send_by: jsonMsg.sentby_user_id,
                    //msg_sendtime:jsonMsg
                    msg_localid: jsonMsg.msg_local_id,
                    timestamp: jsonMsg.timestamp,
                    msg_serverid: 11
                });
                newqueuemessage.save(function (err) {
                    if (err) {
                        return err;
                    } else {
                        console.log("New message  added in queue !");
                    }
                });
                if (doc.length > 0) {
                    // if user is present, then update his socket id					
                    var socketid = doc[0].socketId;
                    console.log("socket id of opponent " + socketid);
                    if (io.sockets.sockets[socketid] !== undefined)
                    {//user connected to node server
                        io.sockets.socket(socketid).emit("receivemessage", test);
                    } else//When user is not connected to node server
                    {
                        console.log("==============++++++==============");
                        console.log("Socket not connected");
                        var myarr = '{"message_local_id":"' + jsonMsg.msg_local_id + '","status":"1","userid_to":"' + jsonMsg.userto_id + '","timestamp":"' + jsonMsg.timestamp + '"}';
                        // io.sockets.socket(client.id).emit("messagestatus", myarr);
                        /* un comment when status needed
                         if (io.sockets.socket(client.id) !== undefined)
                         {
                         console.log("**socket id is valid for sending message user**");
                         io.sockets.socket(client.id).emit("messagestatus", myarr);
                         } else
                         {
                         console.log("**socket id is not valid for sending message user**");
                         var newqueuemessage = new MessagequeueSchema({
                         type: 2,
                         userId_to: jsonMsg.sentBy,
                         to_send: jsonMsg.userto_id,
                         msg_localid: jsonMsg.msg_local_id,
                         msg_serverid: 11,
                         msg_status: 1
                         });
                         newqueuemessage.save(function (err) {
                         if (err) {
                         return err;
                         } else {
                         console.log("New message  added in queue !");
                         }
                         });
                         }
                         un comment when status needed */

                    }

                }/* un comment when status needed 
                 else//when doc get from mongadb length is less that 0
                 {
                 console.log("Socket not connected");
                 var myarr = '{"message_local_id":"' + jsonMsg.msg_local_id + '","status":"1","userid_to":"' + jsonMsg.userto_id + '"}';
                 // io.sockets.socket(client.id).emit("messagestatus", myarr);
                 if (io.sockets.socket(client.id) !== undefined)
                 {
                 console.log("**socket id is valid for sending message user**");
                 io.sockets.socket(client.id).emit("messagestatus", myarr);
                 } else
                 {
                 console.log("**socket id is not valid for sending message user**");
                 var newqueuemessage = new MessagequeueSchema({
                 type: 2,
                 userId_to: jsonMsg.sentBy,
                 to_send: jsonMsg.userto_id,
                 msg_localid: jsonMsg.msg_local_id,
                 msg_serverid: 11,
                 msg_status: 1
                 });
                 newqueuemessage.save(function (err) {
                 if (err) {
                 return err;
                 } else {
                 console.log("New message  added in queue !");
                 }
                 });
                 }
                 
                 }un comment when status needed */

            }
        });
    };

    //searching the public groups
    client.on("searchGroup", function (msg) {
        pool.getConnection(function (err, connection) {
            if (err)
            {
                connection.release();
                return;
            }
            var jsonMsg = JSON.parse(msg);
            //searching the pin vch selects the user which is a group and public
            var strQuery = "SELECT * FROM users WHERE contact_isnovisible=1 and contact_isgroup=1 and pin_no like '%" + jsonMsg.group_pin + "%'";
            console.log(strQuery);
            connection.query(strQuery, function (err, groupinfo) {
                if (err) {
                    console.log("err:::" + err);
                    throw err;
                } else {
                    console.log("groupinfo:::" + groupinfo);
                    if (groupinfo.length > 0) {
                        var group_full_data = {};
                        var group_full_info = [];
                        async.forEachSeries(groupinfo, function (groupinfoeach, callback_1)
                        {
                            var strQuery = "SELECT * FROM groupusers,users WHERE group_id=" + groupinfoeach.userid + " and user_id = userid and request_status = 1"; //getting whole data of group members
                            console.log(strQuery);
                            connection.query(strQuery, function (err, rows) {
                                if (err) {
                                    throw err;
                                } else {
                                    if (rows.length > 0) {
                                        var group_data = {};
                                        var group_members = [];
                                        group_data.group_id = groupinfoeach.userid;
                                        group_data.group_pin = groupinfoeach.pin_no;
                                        group_data.group_name = groupinfoeach.contact_displayname;
                                        group_data.group_thumb_image = groupinfoeach.contact_profilepicthumb;
                                        group_data.group_image = groupinfoeach.contact_profilepic;
                                        group_data.group_timestamp = groupinfoeach.created_time;
                                        group_data.group_created_by = groupinfoeach.created_by;

                                        async.forEachSeries(rows, function (item, callback_2)
                                        {
                                            var group_members_data = {};
                                            group_members_data.user_id = item.user_id;
                                            group_members_data.is_moderator = item.is_moderator;
                                            group_members_data.pin_no = item.pin_no;
                                            group_members_data.contact_displayname = item.contact_displayname;
                                            group_members_data.contact_status = item.contact_status;
                                            group_members_data.contact_gender = item.contact_gender;
                                            group_members_data.contact_profilepic = item.contact_profilepic;
                                            group_members_data.contact_profilepicthumb = item.contact_profilepicthumb;
                                            group_members.push(group_members_data);
                                            callback_2();
                                        }, function () {
                                            group_data.group_members = group_members;
                                            group_full_info.push(group_data);
//                                            io.sockets.socket(client.id).emit("searchGroupResponse", group_data);
                                            callback_1();
                                        });
                                    }
                                }
                            });
                        }, function () {

                            group_full_data.group_full_data = group_full_info;
                            console.log(group_full_data);
//                            group_data.group_members = group_members;
                            io.sockets.socket(client.id).emit("searchGroupResponse", group_full_data);
                        });
                    }
                }
            });
        });
    });

//  leaving group event
    client.on("leaveGroup", function (data) {
        var receivedTime = Math.floor(Date.now() / 1000);
        var jsonData = JSON.parse(data);
        var groupId = jsonData.group_id;
        var userId = jsonData.user_id;
        var moderatorId;
        pool.getConnection(function (err, connection) {
            if (err)
            {
                console.log(err);
                connection.release();
                return;
            }
            var strQuery = "Select * FROM groupusers WHERE group_id=" + groupId + " and is_moderator=1 and request_status = 1";
            console.log(strQuery);
            connection.query(strQuery, function (err, admininfo) {
                if (err) {
                    console.log(err);
                    throw err;
                } else {
                    //deleting the record 
                    var strQuery = "DELETE FROM groupusers WHERE group_id=" + groupId + " and user_id=" + userId;
                    console.log(strQuery);
                    connection.query(strQuery, function (err, row) {
                        if (err) {
                            console.log(err);
                            throw err;
                        } else {
                            var jsonData = {};
                            jsonData.group_id = groupId;
                            jsonData.user_id = userId;
                            jsonData.timestamp = receivedTime;
                            var jsonString = JSON.stringify(jsonData);
                            io.sockets.socket(client.id).emit("leaveGroupNotification", jsonString);
                            //querying DB to get full details of member of that group to notify them
                            var strQuery = "SELECT * FROM groupusers WHERE group_id=" + groupId + " and request_status = 1";
                            console.log(strQuery);
                            connection.query(strQuery, function (err, groupinfo) {
                                if (err) {
                                    console.log(err);
                                    throw err;
                                } else {

                                    console.log(groupinfo);
                                    if (groupinfo.length > 0) {
                                        console.log("moderatorIdmoderatorIdmoderatorId::::" + moderatorId);
                                        console.log("admininfo.user_id::::" + admininfo[0].user_id);
                                        console.log("userId::::" + userId);
                                        if ("" + admininfo[0].user_id === userId) {
                                            //changing the moderator as he is the 1 leaving the group
                                            console.log("trueeeeeeeeeeeeee");
                                            //randomly selecting a member for admin role
                                            var item = groupinfo[Math.floor(Math.random() * groupinfo.length)];
                                            moderatorId = item.user_id;
                                            console.log("moderatorId:::::::::::" + moderatorId);
                                            var strQuery = "Update groupusers SET is_moderator=1 WHERE user_id=" + moderatorId;
                                            console.log(strQuery);
                                            connection.query(strQuery, function (err, admininfo) {
                                                if (err) {
                                                    moderatorId = 1234;
                                                    console.log(err);
                                                    throw err;
                                                } else {
                                                }
                                            });
                                        }
                                        else {
                                            console.log("falseeeeeeeeeeeeee");
                                            moderatorId = admininfo[0].user_id;
                                        }
                                        async.forEachSeries(groupinfo, function (eachmember, callback)
                                        {
                                            //to get socket id
                                            UserSchema.find({
                                                'userId': eachmember.user_id
                                            }, function (err, doc) {
                                                if (err)
                                                {
                                                    console.log("error in getting user details");
                                                    return err;
                                                } else {
                                                    if (doc.length > 0) {
                                                        var socketid = doc[0].socketId;
                                                        console.log("socket id of opponent " + socketid);
                                                        if (io.sockets.sockets[socketid] !== undefined)
                                                        {//user connected to node server
                                                            var jsonData = {};
                                                            jsonData.group_id = groupId;
                                                            jsonData.user_id = userId;
                                                            jsonData.timestamp = receivedTime;
                                                            jsonData.msg_data = '{"moderator_id":"' + moderatorId + '"}';
                                                            var jsonString = JSON.stringify(jsonData);
                                                            io.sockets.socket(socketid).emit("leaveGroupNotification", jsonString);
                                                        } else//When user is not connected to node server
                                                        {
                                                            var newqueuemessage = new MessagequeueSchema({
                                                                type: 5,
                                                                userId_to: eachmember.user_id,
                                                                userId_from: groupId,
                                                                send_by: userId,
                                                                timestamp: receivedTime,
                                                                msg_data: '{"moderator_id":"' + moderatorId + '"}'
                                                            });
                                                            newqueuemessage.save(function (err) {
                                                                if (err) {
                                                                    return err;
                                                                } else {
                                                                    console.log("New message  added in queue !");
                                                                }
                                                            });
                                                        }
                                                    }
                                                }
                                            });
                                            callback();
                                        }, function () {


                                        });
                                    } else {
                                        //incase there are no members left in the group
                                        //coding to delete group from user DB
                                        var strQuery = "DELETE FROM users WHERE userid=" + groupId;
                                        console.log(strQuery);
                                        connection.query(strQuery, function (err, row) {
                                            if (err) {
                                                console.log(err);
                                                throw err;
                                            } else {
                                                console.log("group deleted");
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
            });
        });

    });
//    group Join Request
    client.on("groupJoinRequest", function (msg) {
        var receivedTime = Math.floor(Date.now() / 1000);
        var jsonMsg = JSON.parse(msg);
        var user = jsonMsg.user_id;
        var groupId = jsonMsg.group_id;
        var moderatorId;
        var jsonData = {};
        var jsonUserData = {};
        pool.getConnection(function (err, connection) {
            if (err)
            {
                console.log(err);
                connection.release();
                return;
            }
            var userinfoQuery = "Select * FROM users WHERE userid=" + user; //getting the information of user who requested to join group
            console.log(userinfoQuery);
            connection.query(userinfoQuery, function (err, userinfo) {
                if (err) {
                    console.log(err);
                    throw err;
                } else {
                    if (userinfo.length > 0) {
                        jsonUserData.user_id = userinfo[0].userid;
                        jsonUserData.pin_no = userinfo[0].pin_no;
                        jsonUserData.contact_displayname = userinfo[0].contact_displayname;
                        jsonUserData.contact_status = userinfo[0].contact_status;
                        jsonUserData.contact_gender = userinfo[0].contact_gender;
                        jsonUserData.contact_profilepic = userinfo[0].contact_profilepic;
                        jsonUserData.contact_profilepicthumb = userinfo[0].contact_profilepicthumb;

                        var admininfoQuery = "Select * FROM groupusers WHERE group_id=" + groupId + " and is_moderator=1"; //query for matching groupid and moderatori
                        console.log(admininfoQuery);
                        connection.query(admininfoQuery, function (err, admininfo) {
                            if (err) {
                                console.log(err);
                                throw err;
                            } else {
                                if (admininfo.length > 0) {
                                    moderatorId = admininfo[0].user_id;
                                    //insert into groupusers
                                    console.log("moderatorId:::" + moderatorId);
                                    var strQueryGroupMembers = "INSERT INTO groupusers SET group_id =" + groupId + " , user_id =" + user + ", is_moderator=0, request_status=0";
                                    console.log(strQueryGroupMembers);
                                    connection.query(strQueryGroupMembers, function (err, row) {
                                        if (err) {
                                            console.log(err);
                                            throw err;
                                        } else {

                                            UserSchema.find({
                                                'userId': moderatorId
                                            }, function (err, doc) {
                                                if (err)
                                                {
                                                    console.log("error in getting user details");
                                                    return err;
                                                } else {

                                                    if (doc.length > 0) {
                                                        // if user is present, then update his socket id					
                                                        var socketid = doc[0].socketId;
                                                        console.log("socket id of opponent " + socketid);
                                                        jsonData.user_data = jsonUserData;
                                                        jsonData.groupId = groupId;
                                                        jsonData.moderatorId = moderatorId;
                                                        jsonData.timestamp = receivedTime;
                                                        var jsonString = JSON.stringify(jsonData);
                                                        if (io.sockets.sockets[socketid] !== undefined)
                                                        {//user connected to node server
                                                            io.sockets.socket(socketid).emit("groupJoinRequestMessage", jsonString);
                                                        } else//When user is not connected to node server
                                                        {
                                                            console.log("Socket not connected");
                                                            var jsonUserDataString = JSON.stringify(jsonUserData);
                                                            var newqueuemessage = new MessagequeueSchema({
                                                                type: 8,
                                                                userId_to: moderatorId,
                                                                userId_from: groupId,
                                                                send_by: user,
                                                                timestamp: receivedTime,
                                                                msg_data: jsonUserDataString
                                                            });
                                                            newqueuemessage.save(function (err) {
                                                                if (err) {
                                                                    return err;
                                                                } else {
                                                                    console.log("New message  added in queue !");
                                                                }
                                                            });
                                                        }
                                                    }
                                                }
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    }
                }
            });
        });
    });

//  update when the user comes online
    client.on("updateUserOnline", function (msg) {
        var jsonMsg = JSON.parse(msg);
        var status = jsonMsg.status;
        var user = jsonMsg.user_id;
        var lastseen = Math.floor(Date.now() / 1000);

        UserSchema.find({
            'userId': user
        }, function (err, doc) {
            if (err) {
                return err;
            } else {
                if (doc.length > 0) {
                    doc[0].lastseen = lastseen;
                    doc[0].isOnline = status;
                    doc[0].save();
                }
            }
        });
    });

//  remove a member from the group
    client.on("removeFromGroup", function (msg) {
        var receivedTime = Math.floor(Date.now() / 1000);
        var jsonMsg = JSON.parse(msg);

        var moderatorId = jsonMsg.moderator_id;
        var user = jsonMsg.user_id;
        var groupId = jsonMsg.group_id;
        pool.getConnection(function (err, connection) {
            if (err)
            {
                console.log(err);
                connection.release();
                return;
            }
            var strQuery = "Select * FROM groupusers WHERE group_id=" + groupId + " and is_moderator=1";
            console.log(strQuery);
            connection.query(strQuery, function (err, moderatorinfo) {
                if (err) {
                    console.log(err);
                    throw err;
                } else {
                    console.log(moderatorinfo);
                    if (moderatorinfo.length > 0) {
                        var jsonMessage = {};
                        if ("" + moderatorinfo[0].user_id === moderatorId) {//the requested user is a moderator
                            // perform the required task
                            var strQuery = "SELECT * FROM groupusers WHERE group_id=" + groupId + " and request_status = 1";
                            console.log(strQuery);
                            connection.query(strQuery, function (err, groupinfo) {
                                if (err) {
                                    console.log(err);
                                    throw err;
                                } else {
                                    //deleting the record 
                                    var strQuery = "DELETE FROM groupusers WHERE group_id=" + groupId + " and user_id=" + user + " and request_status = 1";
                                    console.log(strQuery);
                                    connection.query(strQuery, function (err, row) {
                                        if (err) {
                                            console.log(err);
                                            throw err;
                                        } else {
                                            //querying DB to get full details of member of that group to notify them

                                            console.log(groupinfo);
                                            if (groupinfo.length > 0) {

                                                async.forEachSeries(groupinfo, function (eachmember, callback)
                                                {
                                                    //to get socket id
                                                    UserSchema.find({
                                                        'userId': eachmember.user_id
                                                    }, function (err, doc) {
                                                        if (err)
                                                        {
                                                            console.log("error in getting user details");
                                                            return err;
                                                        } else {
                                                            if (doc.length > 0) {
                                                                var socketid = doc[0].socketId;
                                                                console.log("socket id of opponent " + socketid);
                                                                if (io.sockets.sockets[socketid] !== undefined)
                                                                {//user connected to node server
                                                                    jsonMessage.moderator_id = moderatorId;
                                                                    jsonMessage.group_id = groupId;
                                                                    jsonMessage.user_id = user;
                                                                    jsonMessage.timestamp = receivedTime;
                                                                    var jsonString = JSON.stringify(jsonMessage);
                                                                    io.sockets.socket(socketid).emit("removeFromGroupNotification", jsonString);
                                                                } else//When user is not connected to node server
                                                                {
                                                                    var newqueuemessage = new MessagequeueSchema({
                                                                        type: 6,
                                                                        userId_to: eachmember.user_id,
                                                                        userId_from: groupId,
                                                                        send_by: moderatorId,
                                                                        timestamp: receivedTime,
                                                                        msg_data: user
                                                                    });
                                                                    newqueuemessage.save(function (err) {
                                                                        if (err) {
                                                                            return err;
                                                                        } else {
                                                                            console.log("New message  added in queue !");
                                                                        }
                                                                    });
                                                                }
                                                            }
                                                        }
                                                    });
                                                    callback();
                                                }, function () {

                                                });
                                            }
                                        }
                                    });
                                }
                            });
                        } else {
                            jsonMessage.error = 101;
                            jsonMessage.msg = "the requested user is not a moderator";
                            var stringMessage = JSON.stringify(jsonMessage);
                            io.sockets.socket(client.id).emit("removeFromGroupNotification", stringMessage);
                        }
                    }
                    else {
                        console.log("Moderator is not present in the group"); //this situation will never arise
                    }
                }
            });
        });
    });

//  add a member to the group
    client.on("addMemberToGroup", function (msg) {
        var receivedTime = Math.floor(Date.now() / 1000);
        var jsonMsg = JSON.parse(msg);
        var group_members_list = [];

        var moderatorId = jsonMsg.moderator_id;
        var user = jsonMsg.user_id;
        var groupId = jsonMsg.group_id;
        pool.getConnection(function (err, connection) {
            if (err)
            {
                console.log(err);
                connection.release();
                return;
            }
            var strQuery = "Select * FROM groupusers,users WHERE group_id=" + groupId + " and is_moderator=1 AND users.userid = groupusers.group_id";
            console.log(strQuery);
            connection.query(strQuery, function (err, moderatorinfo) {
                if (err) {
                    console.log(err);
                    throw err;
                } else {
                    console.log(moderatorinfo);
                    if (moderatorinfo.length > 0) {
                        var jsonMessage = {};
                        if ("" + moderatorinfo[0].user_id === moderatorId) {//the requested user is a moderator
                            // perform the required task
                            //deleting the record 
                            var strQuery = "INSERT INTO groupusers SET group_id =" + groupId + " , user_id =" + user + ", is_moderator=0, request_status=1";
                            console.log(strQuery);
                            connection.query(strQuery, function (err, row) {
                                if (err) {
                                    console.log(err);
                                    throw err;
                                } else {
                                    var jsonUserData = {};
                                    var getUserDataQuery = "SELECT * FROM users WHERE userid=" + user;
                                    console.log(strQuery);
                                    connection.query(getUserDataQuery, function (err, userData) {
                                        if (err) {

                                        } else {
                                            if (userData.length > 0) {
                                                jsonUserData.user_id = userData[0].userid;
                                                jsonUserData.pin_no = userData[0].pin_no;
                                                jsonUserData.contact_displayname = userData[0].contact_displayname;
                                                jsonUserData.contact_status = userData[0].contact_status;
                                                jsonUserData.contact_gender = userData[0].contact_gender;
                                                jsonUserData.contact_profilepic = userData[0].contact_profilepic;
                                                jsonUserData.contact_profilepicthumb = userData[0].contact_profilepicthumb;
                                            }
                                        }
                                    });

                                    //querying DB to get full details of member of that group to notify them
                                    var strQuery = "SELECT * FROM groupusers,users WHERE group_id=" + groupId + " and users.userid=groupusers.user_id and request_status = 1";
                                    console.log(strQuery);
                                    connection.query(strQuery, function (err, groupinfo) {
                                        if (err) {
                                            console.log(err);
                                            throw err;
                                        } else {

                                            console.log(groupinfo);
                                            if (groupinfo.length > 0) {

                                                async.forEachSeries(groupinfo, function (eachmember, callback)
                                                {
                                                    var group_members_data = {};
                                                    group_members_data.user_id = eachmember.userid;
                                                    group_members_data.pin_no = eachmember.pin_no;
                                                    group_members_data.contact_displayname = eachmember.contact_displayname;
                                                    group_members_data.contact_status = eachmember.contact_status;
                                                    group_members_data.contact_gender = eachmember.contact_gender;
                                                    group_members_data.contact_profilepic = eachmember.contact_profilepic;
                                                    group_members_data.contact_profilepicthumb = eachmember.contact_profilepicthumb;

                                                    group_members_list.push(group_members_data);
                                                    if (eachmember.user_id + "" !== user) {
                                                        //to get socket id
                                                        UserSchema.find({
                                                            'userId': eachmember.user_id
                                                        }, function (err, doc) {
                                                            if (err)
                                                            {
                                                                console.log("error in getting user details");
                                                                return err;
                                                            } else {
                                                                if (doc.length > 0) {
                                                                    var jsonUserDataString = JSON.stringify(jsonUserData);
                                                                    var socketid = doc[0].socketId;
                                                                    console.log("socket id of opponent " + socketid);
                                                                    if (io.sockets.sockets[socketid] !== undefined)
                                                                    {//user connected to node server
                                                                        jsonMessage.moderator_id = moderatorId;
                                                                        jsonMessage.group_id = groupId;
                                                                        jsonMessage.user_data = jsonUserData;
                                                                        jsonMessage.timestamp = receivedTime;
                                                                        var jsonString = JSON.stringify(jsonMessage);
                                                                        io.sockets.socket(socketid).emit("addMemberToGroupNotification", jsonString);
                                                                    } else//When user is not connected to node server
                                                                    {
                                                                        console.log("ooooooooooooooooooooooooo");
                                                                        var newqueuemessage = new MessagequeueSchema({
                                                                            type: 7,
                                                                            userId_to: eachmember.user_id,
                                                                            userId_from: groupId,
                                                                            send_by: moderatorId,
                                                                            msg_data: jsonUserDataString,
                                                                            timestamp: receivedTime,
                                                                            msg_serverid: 11
                                                                        });
                                                                        newqueuemessage.save(function (err) {
                                                                            if (err) {
                                                                                return err;
                                                                            } else {
                                                                                console.log("New message  added in queue !");
                                                                            }
                                                                        });
                                                                        console.log("ooooooooooooooooooooooooo");
                                                                    }
                                                                }
                                                            }
                                                        });
                                                    }
                                                    callback();
                                                }, function () {
                                                    console.log("in function========================");
                                                    var groupmembesdata = JSON.stringify(group_members_list);
                                                    var groupCreationData = '{"group_name":"' + moderatorinfo[0].contact_displayname + '","group_id":"' + groupId + '","group_pin":"' + moderatorinfo[0].pin_no + '","group_profilepic":"' + moderatorinfo[0].contact_profilepic + '","group_profilepicthumb":"' + moderatorinfo[0].contact_profilepicthumb + '","group_isvisible":"' + moderatorinfo[0].contact_isnovisible + '","group_timestamp":"' + moderatorinfo[0].created_time + '","group_created_by":"' + moderatorinfo[0].created_by + '","moderator_id":"' + moderatorinfo[0].user_id + '","timestamp":"' + receivedTime + '","arrayGroupMembers":' + groupmembesdata + '}';

                                                    ///notifying the added member
                                                    UserSchema.find({
                                                        'userId': user
                                                    }, function (err, doc) {
                                                        if (err)
                                                        {
                                                            console.log("error in getting user details");
                                                            return err;
                                                        } else {
                                                            if (doc.length > 0) {
                                                                var socketid = doc[0].socketId;
                                                                console.log("socket id of opponent " + socketid);
                                                                if (io.sockets.sockets[socketid] !== undefined)
                                                                {//user connected to node server
                                                                    //jsonMessage.moderator_id = moderatorId;
                                                                    // jsonMessage.group_id = groupId;
                                                                    // jsonMessage.user_data = jsonUserData;
                                                                    // var jsonString = JSON.stringify(jsonMessage);
                                                                    io.sockets.socket(socketid).emit("groupAddition", groupCreationData);
                                                                } else//When user is not connected to node server
                                                                {
                                                                    var newqueuemessage = new MessagequeueSchema({
                                                                        type: 11,
                                                                        userId_to: user,
                                                                        userId_from: groupId,
                                                                        msg_data: groupCreationData,
                                                                        timestamp: receivedTime,
                                                                        msg_serverid: 11
                                                                    });
                                                                    newqueuemessage.save(function (err) {
                                                                        if (err) {
                                                                            return err;
                                                                        } else {
                                                                            console.log("New message  added in queue !");
                                                                        }
                                                                    });
                                                                }
                                                            }
                                                        }
                                                    });
                                                });
                                            }
                                        }
                                    });
                                }
                            });
                        } else {
                            jsonMessage.error = 101;
                            jsonMessage.msg = "the requested user is not a moderator";
                            jsonMessage.timestamp = receivedTime;
                            var stringMessage = JSON.stringify(jsonMessage);
                            io.sockets.socket(client.id).emit("addMemberToGroupNotification", stringMessage);
                        }
                    }
                    else {
                        console.log("Moderator is not present in the group"); //this situation will never arise
                    }
                }
            });
        });
    });

//  accept or reject group join request from the pingova user by moderator
    client.on("acceptOrRejectMemberRequest", function (msg) {
        var receivedTime = Math.floor(Date.now() / 1000);
        var jsonMsg = JSON.parse(msg);
        var group_members_list = [];
        var moderatorId = jsonMsg.moderator_id;
        var user = jsonMsg.user_id;
        var groupId = jsonMsg.group_id;
        var requestStatus = jsonMsg.request_status;
        pool.getConnection(function (err, connection) {
            if (err)
            {
                console.log(err);
                connection.release();
                return;
            }
            var strQuery = "Select * FROM groupusers,users WHERE group_id=" + groupId + " and is_moderator=1 AND users.userid = groupusers.group_id";
            console.log(strQuery);
            connection.query(strQuery, function (err, moderatorinfo) {
                if (err) {
                    console.log(err);
                    throw err;
                } else {
                    console.log(moderatorinfo);
                    if (moderatorinfo.length > 0) {
                        var jsonMessage = {};
                        if ("" + moderatorinfo[0].user_id === moderatorId) {//the requested user is a moderator
                            // perform the required task
                            //deleting the record 
                            var strQuery = "UPDATE groupusers SET  request_status=" + requestStatus + " where group_id =" + groupId + " and user_id =" + user;
                            console.log(strQuery);
                            connection.query(strQuery, function (err, row) {
                                if (err) {
                                    console.log(err);
                                    throw err;
                                } else {
                                    if (requestStatus === '1')
                                    {
                                        var jsonUserData = {};
                                        var getUserDataQuery = "SELECT * FROM users WHERE userid=" + user;
                                        console.log(strQuery);
                                        connection.query(getUserDataQuery, function (err, userData) {
                                            if (err) {

                                            } else {
                                                if (userData.length > 0) {
                                                    jsonUserData.user_id = userData[0].userid;
                                                    jsonUserData.pin_no = userData[0].pin_no;
                                                    jsonUserData.contact_displayname = userData[0].contact_displayname;
                                                    jsonUserData.contact_status = userData[0].contact_status;
                                                    jsonUserData.contact_gender = userData[0].contact_gender;
                                                    jsonUserData.contact_profilepic = userData[0].contact_profilepic;
                                                    jsonUserData.contact_profilepicthumb = userData[0].contact_profilepicthumb;
                                                }
                                            }
                                        });

                                        //querying DB to get full details of member of that group to notify them
                                        var strQuery = "SELECT * FROM groupusers,users WHERE group_id=" + groupId + " and users.userid=groupusers.user_id and request_status = 1";
                                        console.log(strQuery);
                                        connection.query(strQuery, function (err, groupinfo) {
                                            if (err) {
                                                console.log(err);
                                                throw err;
                                            } else {

                                                console.log(groupinfo);
                                                if (groupinfo.length > 0) {

                                                    async.forEachSeries(groupinfo, function (eachmember, callback)
                                                    {
                                                        var group_members_data = {};
                                                        group_members_data.user_id = eachmember.userid;
                                                        group_members_data.pin_no = eachmember.pin_no;
                                                        group_members_data.contact_displayname = eachmember.contact_displayname;
                                                        group_members_data.contact_status = eachmember.contact_status;
                                                        group_members_data.contact_gender = eachmember.contact_gender;
                                                        group_members_data.contact_profilepic = eachmember.contact_profilepic;
                                                        group_members_data.contact_profilepicthumb = eachmember.contact_profilepicthumb;

                                                        group_members_list.push(group_members_data);
                                                        if (eachmember.user_id + "" !== user) {
                                                            //to get socket id
                                                            UserSchema.find({
                                                                'userId': eachmember.user_id
                                                            }, function (err, doc) {
                                                                if (err)
                                                                {
                                                                    console.log("error in getting user details");
                                                                    return err;
                                                                } else {
                                                                    if (doc.length > 0) {
                                                                        var socketid = doc[0].socketId;
                                                                        console.log("socket id of opponent " + socketid);
                                                                        if (io.sockets.sockets[socketid] !== undefined)
                                                                        {//user connected to node server
                                                                            jsonMessage.moderator_id = moderatorId;
                                                                            jsonMessage.group_id = groupId;
                                                                            jsonMessage.user_data = jsonUserData;
                                                                            jsonMessage.timestamp = receivedTime;
                                                                            var jsonString = JSON.stringify(jsonMessage);
                                                                            io.sockets.socket(socketid).emit("acceptedMemberToGroupNotification", jsonString);
                                                                        } else//When user is not connected to node server
                                                                        {
                                                                            var jsonUserDataString = JSON.stringify(jsonUserData);
                                                                            var newqueuemessage = new MessagequeueSchema({
                                                                                type: 9,
                                                                                userId_to: eachmember.user_id,
                                                                                userId_from: groupId,
                                                                                send_by: moderatorId,
                                                                                timestamp: receivedTime,
                                                                                msg_data: jsonUserDataString
                                                                            });
                                                                            newqueuemessage.save(function (err) {
                                                                                if (err) {
                                                                                    return err;
                                                                                } else {
                                                                                    console.log("New message  added in queue !");
                                                                                }
                                                                            });
                                                                        }
                                                                    }
                                                                }
                                                            });

                                                        }
                                                        callback();
                                                    }, function () {
                                                        console.log("in function========================");
                                                        var groupmembesdata = JSON.stringify(group_members_list);
                                                        var groupCreationData = '{"request_status":"1","group_name":"' + moderatorinfo[0].contact_displayname + '","group_id":"' + groupId + '","group_pin":"' + moderatorinfo[0].pin_no + '","group_profilepic":"' + moderatorinfo[0].contact_profilepic + '","group_profilepicthumb":"' + moderatorinfo[0].contact_profilepicthumb + '","group_isvisible":"' + moderatorinfo[0].contact_isnovisible + '","group_timestamp":"' + moderatorinfo[0].created_time + '","group_created_by":"' + moderatorinfo[0].created_by + '","moderator_id":"' + moderatorinfo[0].user_id + '","timestamp":"' + receivedTime + '","arrayGroupMembers":' + groupmembesdata + '}';

                                                        ///notifying the added member
                                                        UserSchema.find({
                                                            'userId': user
                                                        }, function (err, doc) {
                                                            if (err)
                                                            {
                                                                console.log("error in getting user details");
                                                                return err;
                                                            } else {
                                                                if (doc.length > 0) {
                                                                    var socketid = doc[0].socketId;
                                                                    console.log("socket id of opponent " + socketid);
                                                                    if (io.sockets.sockets[socketid] !== undefined)
                                                                    {//user connected to node server
                                                                        //jsonMessage.moderator_id = moderatorId;
                                                                        // jsonMessage.group_id = groupId;
                                                                        // jsonMessage.user_data = jsonUserData;
                                                                        // var jsonString = JSON.stringify(jsonMessage);
                                                                        io.sockets.socket(socketid).emit("groupJoinResponse", groupCreationData);
                                                                    } else//When user is not connected to node server
                                                                    {
                                                                        var newqueuemessage = new MessagequeueSchema({
                                                                            type: 10,
                                                                            userId_to: user,
                                                                            userId_from: groupId,
                                                                            send_by: moderatorId,
                                                                            msg_data: groupCreationData,
                                                                            timestamp: receivedTime,
                                                                            msg_serverid: 11
                                                                        });
                                                                        newqueuemessage.save(function (err) {
                                                                            if (err) {
                                                                                return err;
                                                                            } else {
                                                                                console.log("New message  added in queue !");
                                                                            }
                                                                        });
                                                                    }
                                                                }
                                                            }
                                                        });
                                                    });
                                                }
                                            }
                                        });
                                    } else if (requestStatus === '2') {

                                        var groupJoinResponseData = '{"request_status":"2", "timestamp":"' + receivedTime + '"}';

                                        ///notifying the added member
                                        UserSchema.find({
                                            'userId': user
                                        }, function (err, doc) {
                                            if (err)
                                            {
                                                console.log("error in getting user details");
                                                return err;
                                            } else {
                                                if (doc.length > 0) {
                                                    var socketid = doc[0].socketId;
                                                    console.log("socket id of opponent " + socketid);
                                                    if (io.sockets.sockets[socketid] !== undefined)
                                                    {//user connected to node server
                                                        //jsonMessage.moderator_id = moderatorId;
                                                        // jsonMessage.group_id = groupId;
                                                        // jsonMessage.user_data = jsonUserData;
                                                        // var jsonString = JSON.stringify(jsonMessage);
                                                        io.sockets.socket(socketid).emit("groupJoinResponse", groupJoinResponseData);
                                                    } else//When user is not connected to node server
                                                    {
                                                        var newqueuemessage = new MessagequeueSchema({
                                                            type: 10,
                                                            userId_to: user,
                                                            userId_from: groupId,
                                                            send_by: moderatorId,
                                                            msg_data: groupJoinResponseData,
                                                            timestamp: receivedTime,
                                                            msg_serverid: 11
                                                        });
                                                        newqueuemessage.save(function (err) {
                                                            if (err) {
                                                                return err;
                                                            } else {
                                                                console.log("New message  added in queue !");
                                                            }
                                                        });
                                                    }
                                                }
                                            }
                                        });
                                    }
                                }
                            });
                        } else {
                            jsonMessage.error = 101;
                            jsonMessage.msg = "the requested user is not a moderator";
                            var stringMessage = JSON.stringify(jsonMessage);
                            io.sockets.socket(client.id).emit("addMemberToGroupNotification", stringMessage);
                        }
                    }
                    else {
                        console.log("Moderator is not present in the group"); //this situation will never arise
                    }
                }
            });
        });
    });

    //updating visibility of lastseen
    client.on("updateLastseenVisibility", function (msg) {
        var jsonMsg = JSON.parse(msg);
        var user = jsonMsg.user_id;
        var visibilityLastseen = jsonMsg.status; //0 all 1 none 2 contact
        pool.getConnection(function (err, connection) {
            if (err)
            {
                console.log(err);
                connection.release();
                return;
            }
            var strQuery = "UPDATE users SET contact_lastseen_visibility ='" + visibilityLastseen + "' WHERE userid = " + user;
            console.log(strQuery);
            connection.query(strQuery, function (err, rows) {
                if (err) {
                    console.log(err);
//                    throw err;
                } else {
                    var myarr;
                    console.log(rows);
                    console.log(rows.affectedRows);
                    if (rows.affectedRows > 0) {
                        myarr = '{"updated_lastseen_visibility":"1"}';
                    } else {
                        myarr = '{"updated_lastseen_visibility":"0"}';
                    }
                    io.sockets.socket(client.id).emit("updateLastseenVisibilityResponse", myarr);
                }
            });
        });
    });

    //updating visibility of status
    client.on("updateStatusVisibility", function (msg) {
        var jsonMsg = JSON.parse(msg);
        var user = jsonMsg.user_id;
        var visibilityStatus = jsonMsg.status; //0 all 1 none 2 contact
        pool.getConnection(function (err, connection) {
            if (err)
            {
                console.log(err);
                connection.release();
                return;
            }
            var strQuery = "UPDATE users SET contact_status_visibility ='" + visibilityStatus + "' WHERE userid = " + user;
            console.log(strQuery);
            connection.query(strQuery, function (err, rows) {
                if (err) {
                    console.log(err);
//                    throw err;
                } else {
                    var myarr;
                    console.log(rows);
                    console.log(rows.affectedRows);
                    if (rows.affectedRows > 0) {
                        myarr = '{"updated_status_visibility":"1"}';
                    } else {
                        myarr = '{"updated_status_visibility":"0"}';
                    }
                    io.sockets.socket(client.id).emit("updateStatusVisibilityResponse", myarr);
                }
            });
        });
    });

    //updating visibility of profile pic
    client.on("updateProfilePicVisibility", function (msg) {
        var jsonMsg = JSON.parse(msg);
        var user = jsonMsg.user_id;
        var visibilityProfilePic = jsonMsg.status; //0 all 1 none 2 contact
        pool.getConnection(function (err, connection) {
            if (err)
            {
                console.log(err);
                connection.release();
                return;
            }
            var strQuery = "UPDATE users SET contact_privacy_pic ='" + visibilityProfilePic + "' WHERE userid = " + user;
            console.log(strQuery);
            connection.query(strQuery, function (err, rows) {
                if (err) {
                    console.log(err);
//                    throw err;
                } else {
                    var myarr;
                    console.log(rows);
                    console.log(rows.affectedRows);
                    if (rows.affectedRows > 0) {
                        myarr = '{"updated_profilepic_visibility":"1"}';
                    } else {
                        myarr = '{"updated_profilepic_visibility":"0"}';
                    }
                    io.sockets.socket(client.id).emit("updateProfilePicVisibilityResponse", myarr);
                }
            });
        });
    });

    //fetching data of visible contacts to update with recent data
    client.on("updateUserData", function (msg) {
        var jsonMsg = JSON.parse(msg);
        var user = jsonMsg.user_id;
        var members_list = [];
        var arrayMembers = jsonMsg.array_members;
        console.log(arrayMembers);

        pool.getConnection(function (err, connection) {
            if (err)
            {
                console.log(err);
                connection.release();
                return;
            }
            var strQuery = "SELECT * FROM users WHERE userid in (" + arrayMembers + ")";
            console.log(strQuery);
            connection.query(strQuery, function (err, rows) {
                if (err) {
                    console.log(err);
//                    throw err;
                } else {
                    console.log(rows);
                    console.log(rows.affectedRows);
                    async.forEachSeries(rows, function (member, callback)
                    {
                        console.log("inside adding group data");
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
                        io.sockets.socket(client.id).emit("updateUserDataResponse", members_list);
                    });
                }
            });
        });
    });

    //updating display name
    client.on("updateDisplayName", function (msg) {
        var jsonMsg = JSON.parse(msg);
        var user = jsonMsg.user_id;
        var displayName = jsonMsg.display_name;
        pool.getConnection(function (err, connection) {
            if (err)
            {
                console.log(err);
                connection.release();
                return;
            }
            var strQuery = "UPDATE users SET contact_displayname ='" + displayName + "' WHERE userid = " + user;
            console.log(strQuery);
            connection.query(strQuery, function (err, rows) {
                if (err) {
                    console.log(err);
//                    throw err;
                } else {
                    var myarr;
                    console.log(rows);
                    console.log(rows.affectedRows);
                    if (rows.affectedRows > 0) {
                        myarr = '{"updated_status":"1"}';
                    } else {
                        myarr = '{"updated_status":"0"}';
                    }
                    io.sockets.socket(client.id).emit("updateDisplayNameResponse", myarr);
                }
            });
        });
    });

    //updating display name
    client.on("checkUserData", function (msg) {
        var jsonMsg = JSON.parse(msg);
        var user = jsonMsg.user_id;

        pool.getConnection(function (err, connection) {
            if (err)
            {
                connection.release();
                return;
            }
            //searching if the user was in any group and its data
            var strQuery = "SELECT * FROM groupusers,users WHERE group_id=userid and user_id= " + user;
            console.log(strQuery);
            connection.query(strQuery, function (err, groupinfo) {
                if (err) {
                    console.log("err:::" + err);
                    throw err;
                } else {
                    console.log("groupinfo:::" + groupinfo);
                    if (groupinfo.length > 0) {
                        var group_full_data = {};
                        var group_full_info = [];
                        async.forEachSeries(groupinfo, function (groupinfoeach, callback_1)
                        {
                            var strQuery = "SELECT * FROM groupusers,users WHERE group_id=" + groupinfoeach.userid + " and user_id = userid and request_status = 1"; //getting whole data of group members
                            console.log(strQuery);
                            connection.query(strQuery, function (err, rows) {
                                if (err) {
                                    throw err;
                                } else {
                                    if (rows.length > 0) {
                                        var group_data = {};
                                        var group_members = [];
                                        group_data.group_id = groupinfoeach.userid;
                                        group_data.group_pin = groupinfoeach.pin_no;
                                        group_data.group_name = groupinfoeach.contact_displayname;
                                        group_data.group_thumb_image = groupinfoeach.contact_profilepicthumb;
                                        group_data.group_image = groupinfoeach.contact_profilepic;
                                        group_data.group_timestamp = groupinfoeach.created_time;
                                        group_data.group_created_by = groupinfoeach.created_by;

                                        async.forEachSeries(rows, function (item, callback_2)
                                        {
                                            if ("" + item.user_id !== user) {
                                                var group_members_data = {};
                                                group_members_data.user_id = item.user_id;
                                                group_members_data.is_moderator = item.is_moderator;
                                                group_members_data.pin_no = item.pin_no;
                                                group_members_data.contact_displayname = item.contact_displayname;
                                                group_members_data.contact_status = item.contact_status;
                                                group_members_data.contact_gender = item.contact_gender;
                                                group_members_data.contact_profilepic = item.contact_profilepic;
                                                group_members_data.contact_profilepicthumb = item.contact_profilepicthumb;
                                                group_members.push(group_members_data);
                                            }
                                            callback_2();
                                        }, function () {
                                            group_data.group_members = group_members;
                                            group_full_info.push(group_data);
                                            callback_1();
                                        });
                                    }
                                }
                            });
                        }, function () {
                            group_full_data.group_full_data = group_full_info;
                            console.log(group_full_data);
//                          group_data.group_members = group_members;
                            io.sockets.socket(client.id).emit("checkUserDataResponse", group_full_data);
                        });
                    }
                }
            });
        });
    });

    client.on("deleteAccount", function (msg) {
        var receivedTime = Math.floor(Date.now() / 1000);
        var jsonMsg = JSON.parse(msg);
        var user = jsonMsg.user_id;
        var moderatorId;

        pool.getConnection(function (err, connection) {
            if (err)
            {
                connection.release();
                return;
            }
            //searching if the user was in any group and its data
            var strQuery = "SELECT * FROM groupusers,users WHERE group_id=userid and user_id= " + user;
            console.log(strQuery);
            connection.query(strQuery, function (err, groupinfo) {
                if (err) {
                    console.log("err:::" + err);
                    throw err;
                } else {
                    console.log("groupinfo:::" + groupinfo);
                    if (groupinfo.length > 0) {
                        var group_full_data = {};
                        var group_full_info = [];
                        async.forEachSeries(groupinfo, function (groupinfoeach, callback_1)
                        {
                            var strQuery = "Select * FROM groupusers WHERE group_id=" + groupinfoeach.group_id + " and is_moderator=1 and request_status = 1";
                            console.log(strQuery);
                            connection.query(strQuery, function (err, admininfo) {
                                if (err) {
                                    console.log(err);
                                    throw err;
                                } else {
                                    //deleting the record 
                                    var strQuery = "DELETE FROM groupusers WHERE group_id=" + groupinfoeach.group_id + " and user_id=" + user;
                                    console.log(strQuery);
                                    connection.query(strQuery, function (err, row) {
                                        if (err) {
                                            console.log(err);
                                            throw err;
                                        } else {
                                            var jsonData = {};
                                            jsonData.group_id = groupinfoeach.group_id;
                                            jsonData.user_id = user;
                                            jsonData.timestamp = receivedTime;
                                            var jsonString = JSON.stringify(jsonData);
//                                            io.sockets.socket(client.id).emit("leaveGroupNotification", jsonString);
                                            //querying DB to get full details of member of that group to notify them
                                            var strQuery = "SELECT * FROM groupusers WHERE group_id=" + groupinfoeach.group_id;
                                            +" and request_status = 1";
                                            console.log(strQuery);
                                            connection.query(strQuery, function (err, groupinfo) {
                                                if (err) {
                                                    console.log(err);
                                                    throw err;
                                                } else {
                                                    console.log(groupinfo);
                                                    if (groupinfo.length > 0) {
                                                        console.log("moderatorIdmoderatorIdmoderatorId::::" + moderatorId);
                                                        console.log("admininfo.user_id::::" + admininfo[0].user_id);
                                                        console.log("userId::::" + user);
                                                        if ("" + admininfo[0].user_id === user) {
                                                            //changing the moderator as he is the 1 leaving the group
                                                            console.log("trueeeeeeeeeeeeee");
                                                            //randomly selecting a member for admin role
                                                            var item = groupinfo[Math.floor(Math.random() * groupinfo.length)];
                                                            moderatorId = item.user_id;
                                                            console.log("moderatorId:::::::::::" + moderatorId);
                                                            var strQuery = "Update groupusers SET is_moderator=1 WHERE user_id=" + moderatorId;
                                                            console.log(strQuery);
                                                            connection.query(strQuery, function (err, admininfo) {
                                                                if (err) {
                                                                    moderatorId = 1234;
                                                                    console.log(err);
                                                                    throw err;
                                                                } else {
                                                                }
                                                            });
                                                        }
                                                        else {
                                                            console.log("falseeeeeeeeeeeeee");
                                                            moderatorId = admininfo[0].user_id;
                                                        }
                                                        async.forEachSeries(groupinfo, function (eachmember, callback)
                                                        {
                                                            //to get socket id
                                                            UserSchema.find({
                                                                'userId': eachmember.user_id
                                                            }, function (err, doc) {
                                                                if (err)
                                                                {
                                                                    console.log("error in getting user details");
                                                                    return err;
                                                                } else {
                                                                    if (doc.length > 0) {
                                                                        var socketid = doc[0].socketId;
                                                                        console.log("socket id of opponent " + socketid);
                                                                        if (io.sockets.sockets[socketid] !== undefined)
                                                                        {//user connected to node server
                                                                            var jsonData = {};
                                                                            jsonData.group_id = groupinfoeach.group_id;
                                                                            jsonData.user_id = user;
                                                                            jsonData.timestamp = receivedTime;
                                                                            jsonData.msg_data = '{"moderator_id":"' + moderatorId + '"}';
                                                                            var jsonString = JSON.stringify(jsonData);
                                                                            io.sockets.socket(socketid).emit("leaveGroupNotification", jsonString);
                                                                        } else//When user is not connected to node server
                                                                        {
                                                                            var newqueuemessage = new MessagequeueSchema({
                                                                                type: 5,
                                                                                userId_to: eachmember.user_id,
                                                                                userId_from: groupinfoeach.group_id,
                                                                                send_by: user,
                                                                                timestamp: receivedTime,
                                                                                msg_data: '{"moderator_id":"' + moderatorId + '"}'
                                                                            });
                                                                            newqueuemessage.save(function (err) {
                                                                                if (err) {
                                                                                    return err;
                                                                                } else {
                                                                                    console.log("New message  added in queue !");
                                                                                }
                                                                            });
                                                                        }
                                                                    }
                                                                }
                                                            });
                                                            callback();
                                                        }, function () {
                                                            callback_1();
                                                        });
                                                    } else {
                                                        //incase there are no members left in the group
                                                        //coding to delete group from user DB
                                                        var strQuery = "DELETE FROM users WHERE userid=" + groupinfoeach.group_id;
                                                        console.log(strQuery);
                                                        connection.query(strQuery, function (err, row) {
                                                            if (err) {
                                                                console.log(err);
                                                                throw err;
                                                            } else {
                                                                console.log("group deleted");
                                                            }
                                                        });
                                                    }
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }, function () {
                            //delete user from users table
                            var deleteQuery = "DELETE FROM users WHERE userid= " + user;
                            console.log(deleteQuery);
                            connection.query(deleteQuery, function (err, deleteinfo) {
                                if (err) {
                                    console.log("err:::" + err);
                                    throw err;
                                } else {
                                    if (io.sockets.socket(client.id) !== undefined)
                                    {
                                        console.log("**socket id is valid for sending message user**");
                                        io.sockets.socket(client.id).emit("deleteAccountResponse", '{"status":"200", "user_id":"' + user + '"}');
                                    } else
                                    {
                                        console.log("**socket id is not valid for sending message user**");
                                        var newqueuemessage = new MessagequeueSchema({
                                            type: 12,
                                            userId_to: user,
                                            msg_serverid: 11,
                                            timestamp: receivedTime
                                        });
                                        newqueuemessage.save(function (err) {
                                            if (err) {
                                                return err;
                                            } else {
                                                console.log("New message  added in queue !");
                                            }
                                        });
                                    }
                                }
                            });
                        });
                    } else {
                        //delete user from users table
                        var deleteQuery = "DELETE FROM users WHERE userid= " + user;
                        console.log(deleteQuery);
                        connection.query(deleteQuery, function (err, deleteinfo) {
                            if (err) {
                                console.log("err:::" + err);
                                throw err;
                            } else {
                                if (io.sockets.socket(client.id) !== undefined)
                                {
                                    console.log("**socket id is valid for sending message user**");
                                    io.sockets.socket(client.id).emit("deleteAccountResponse", '{"status":"200", "user_id":"' + user + '"}');
                                } else
                                {
                                    console.log("**socket id is not valid for sending message user**");
                                    var newqueuemessage = new MessagequeueSchema({
                                        type: 12,
                                        userId_to: user,
                                        msg_serverid: 11,
                                        timestamp: receivedTime
                                    });
                                    newqueuemessage.save(function (err) {
                                        if (err) {
                                            return err;
                                        } else {
                                            console.log("New message  added in queue !");
                                        }
                                    });
                                }
                            }
                        });
                    }

                }

            });
        });
    });
});
