var express = require('express');
var app = express();
var server = require('http').createServer(app).listen(1234);
var async = require('async');
var io = require('socket.io').listen(server, {
		'heartbeat interval' : 5,
		'heartbeat timeout' : 10
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


	var pool      =    mysql.createPool({
     connectionLimit : 100, //important
     host     : '169.54.188.252',
     user     : 'pingova',
     password : 'pNUNsGV8KRhPpEfM',
     database : 'pingova',
     debug    :  false
 });
 
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

io.sockets.on('connection', function (client){
	console.log("client connected: " + client.id);

	io.sockets.socket(client.id).emit("connected", client.id);
	
	
	client.on("sendMessage", function (chatMessage) {
        //console.log("Message From: " + chatMessage.fromName);
        // console.log("Message To: " + chatMessage.toName);


        // io.sockets.socket(chatMessage.toClientID).emit("chatMessage", {"fromName" : chatMessage.fromName,
        //"toName" : chatMessage.toName,
        //  "toClientID" : chatMessage.toClientID,
        //  "msg" : chatMessage.msg});
        var jsonMsg = JSON.parse(chatMessage);
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
                if ((typeof messagedata) === "object") {
                    messagedata = JSON.stringify(messagedata);
                }
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
                    //msg_sendtime:jsonMsg
                    msg_localid: jsonMsg.msg_local_id,
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
                        io.sockets.socket(socketid).emit("receivemessage", chatMessage);

//                        var myarr = '{"message_local_id":"' + jsonMsg.msg_local_id + '","status":"2","userid_to":"' + jsonMsg.userto_id + '"}';
//                        if (io.sockets.socket(client.id) !== undefined)
//                        {
//                            console.log("**socket id is valid for sending message user**")
//                            io.sockets.socket(client.id).emit("messagestatus", myarr);
//                        } else
//                        {
//                            console.log("**socket id is not valid for sending message user**")
//                            var newqueuemessage = new MessagequeueSchema({
//                                type: 2,
//                                userId_to: jsonMsg.userfrom_id,
//                                to_send: jsonMsg.userto_id,
//                                msg_localid: jsonMsg.msg_local_id,
//                                msg_serverid: 11,
//                                msg_status: 2,
//                            });
//                            newqueuemessage.save(function (err) {
//                                if (err) {
//                                    return err;
//                                } else {
//                                    console.log("New message  added in queue !");
//                                }
//                            });
//                        }


                    } else//When user is not connected to node server
                    {
                        console.log("==============++++++==============");
                        console.log("Socket not connected");
                        var myarr = '{"message_local_id":"' + jsonMsg.msg_local_id + '","status":"1","userid_to":"' + jsonMsg.userto_id + '"}';
                        // io.sockets.socket(client.id).emit("messagestatus", myarr);
                        if (io.sockets.socket(client.id) != undefined)
                        {
                            console.log("**socket id is valid for sending message user**")
                            io.sockets.socket(client.id).emit("messagestatus", myarr);
                        } else
                        {
                            console.log("**socket id is not valid for sending message user**")
                            var newqueuemessage = new MessagequeueSchema({
                                type: 2,
                                userId_to: jsonMsg.userfrom_id,
                                to_send: jsonMsg.userto_id,
                                msg_localid: jsonMsg.msg_local_id,
                                msg_serverid: 11,
                                msg_status: 1,
                            });
                            newqueuemessage.save(function (err) {
                                if (err) {
                                    return err;
                                } else {
                                    console.log("New message  added in queue !");
                                }
                            });
                        }

//                        var messagedata = jsonMsg.msg_data;
//                        console.log(typeof messagedata);
//                        if ((typeof messagedata) === "object") {
//                            messagedata = JSON.stringify(messagedata);
//                        }
//                        /*msg_status: {
//                         created: null,
//                         delivered: int,
//                         seen: int
//                         },*/
//                        var newqueuemessage = new MessagequeueSchema({
//                            type: 1,
//                            userId_to: jsonMsg.userto_id,
//                            userId_from: jsonMsg.userfrom_id,
//                            msg_type: jsonMsg.msg_type,
//                            msg_data: messagedata,
//                            msg_status: 1,
//                            //msg_sendtime:jsonMsg
//                            msg_localid: jsonMsg.msg_local_id,
//                            msg_serverid: 11
//                        });
//                        newqueuemessage.save(function (err) {
//                            if (err) {
//                                return err;
//                            } else {
//                                console.log("New message  added in queue !");
//                            }
//                        });
                    }

                } else//when doc get from mongadb length is less that 0
                {
                    console.log("Socket not connected");
                    var myarr = '{"message_local_id":"' + jsonMsg.msg_local_id + '","status":"1","userid_to":"' + jsonMsg.userto_id + '"}';
                    // io.sockets.socket(client.id).emit("messagestatus", myarr);
                    if (io.sockets.socket(client.id) !== undefined)
                    {
                        console.log("**socket id is valid for sending message user**")
                        io.sockets.socket(client.id).emit("messagestatus", myarr);
                    } else
                    {
                        console.log("**socket id is not valid for sending message user**")
                        var newqueuemessage = new MessagequeueSchema({
                            type: 2,
                            userId_to: jsonMsg.userfrom_id,
                            to_send: jsonMsg.userto_id,
                            msg_localid: jsonMsg.msg_local_id,
                            msg_serverid: 11,
                            msg_status: 1,
                        });
                        newqueuemessage.save(function (err) {
                            if (err) {
                                return err;
                            } else {
                                console.log("New message  added in queue !");
                            }
                        });
                    }
//                    console.log("============================");
//                    console.log(jsonMsg.msg_data);
//                    var messagedata = jsonMsg.msg_data;
//                    console.log(typeof messagedata);
//                    if ((typeof messagedata) === "object") {
//                        messagedata = JSON.stringify(messagedata);
//                    }
//                    console.log(typeof messagedata);
//                    var newqueuemessage = new MessagequeueSchema({
//                        type: 1,
//                        userId_to: jsonMsg.userto_id,
//                        userId_from: jsonMsg.userfrom_id,
//                        msg_type: jsonMsg.msg_type,
//                        msg_data: messagedata,
//                        msg_status: 1,
//                        //msg_sendtime:jsonMsg
//                        msg_localid: jsonMsg.msg_local_id,
//                        msg_serverid: 11
//                    });
//                    newqueuemessage.save(function (err) {
//                        if (err) {
//                            return err;
//                        } else {
//                            console.log("New message  added in queue !");
//                        }
//                    });

                }

            }
        });
    });
   
   //get the delivered status
    client.on("receivedMessageStatus", function (msg) {

        console.log("==============================================" + msg);
        var jsonMsg = JSON.parse(msg);
        var user = jsonMsg.userfrom_id;

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
                    var myarr = '{"message_local_id":"' + jsonMsg.msg_local_id + '","status":"' + jsonMsg.msg_status + '","userid_to":"' + jsonMsg.userto_id + '"}';
                    // io.sockets.socket(client.id).emit("messagestatus", myarr);
                    if (io.sockets.sockets[socketid] !== undefined)
                    {
                        console.log("**socket id is valid for sending message user**")
                        io.sockets.socket(socketid).emit("messagestatus", myarr);
                    } else
                    {
                        console.log("**socket id is not valid for sending message user**")
                        var newqueuemessage = new MessagequeueSchema({
                            type: 2,
                            userId_to: jsonMsg.userfrom_id,
                            to_send: jsonMsg.userto_id,
                            msg_localid: jsonMsg.msg_local_id,
                            msg_serverid: 11,
                            msg_status: jsonMsg.msg_status
                        });
                        newqueuemessage.save(function (err) {
                            if (err) {
                                return err;
                            } else {
                                console.log("New message  added in queue !");
                            }
                        });
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
                                msg_data: messagedata,
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
		var strQuery = "SELECT * FROM 'User' WHERE phoneno=" + jsonMsg.phone_no;
		connection.query(strQuery, function (err, rows) {
			if (err) {
				throw err;
			} else {
				console.log(rows);
			}
		});
	});
	client.on("updatecontact", function (msg)
	{
		    
			pool.getConnection(function(err,connection){
				if(err)
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
		pool.getConnection(function(err,connection){
         if (err) {
           connection.release();
           return;
         }   
		
		var Query = "SELECT * FROM users WHERE userid=" + jsonMsg.userid;
		connection.query(Query,function(err,rows)
		{
             connection.release();
             if(!err) 
			 {
				console.log("lenght of row  "+rows.length);
				if(rows.length>0)
				{
					var sequencecheck=rows[0].contact_sequence;
				console.log(sequencecheck);
				console.log(jsonMsg.sequence);
				if(sequencecheck == jsonMsg.sequence)
				{
					io.sockets.socket(client.id).emit("checkSequenceResponse", true);
				}else
				{
					io.sockets.socket(client.id).emit("checkSequenceResponse", false);
				}
				console.log(rows);
				}else
				{	
					console.log("user dont have data in my sql");
				}
                
             }           
         });
		
		
		//connection.query(Query, function (err, rows) {
		//	if (err) {
		//		throw err;
		//	} else 
		//	{
		//		var sequencecheck=rows[0].contact_sequence;
		//		console.log(sequencecheck);
		//		console.log(jsonMsg.sequence);
		//		if(sequencecheck == jsonMsg.sequence)
		//		{
		//			io.sockets.socket(client.id).emit("checkSequenceResponse", true);
		//		}else
		//		{
		//			io.sockets.socket(client.id).emit("checkSequenceResponse", false);
		//		}
		//		console.log(rows);
		//	}
		});
	});
	client.on("checkStatus", function (msg) 
	{
		var jsonMsg1 = JSON.parse(msg);
		
		console.log("@@@@@@@@@@@@@@@"+jsonMsg1.userId);
		console.log("@@@@@@@@@@@@@@@"+jsonMsg1.sequence);
		var strQuery = "SELECT * FROM users WHERE userid=" + jsonMsg1.userId;
		//Getting connection from pool
		pool.getConnection(function(err,connection){
         if (err) {
           connection.release();
           return;
         }   
		 
			connection.query(strQuery,function(err,rows){
             connection.release();
             if(!err) 
			 {
                var sequencecheck=rows[0].contact_sequence;
						if(sequencecheck == jsonMsg1.sequence)//Checking sequence is ok or not
						{
						//io.sockets.socket(client.id).emit("checkSequenceResponse", true);
						var userid = jsonMsg1.userId;
						var socketId = jsonMsg1.socketId;

						UserSchema.find({
							'userId' : userid
						}, function (err, doc) {
							if (err) {
								return err;
							} else {
								console.log("Length of doc is " + doc.length)
								if (doc.length > 0) {
									// if user is present, then update his socket id
									doc[0].socketId = socketId;
									doc[0].save();
									console.log("socket Id has been updated for user " + userid + "with a new socket Id: " + socketId);
									console.log(doc);
								} else {
									//we will add a new user here
									var newUser = new UserSchema({
											userId : userid,
											socketId : socketId
						//,
                                           // lastseen: 0
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
						
						MessagequeueSchema.find({
						'userId_to' :userid
						},function(err, doc)
						{
							if(err)
							{
								console.log("ERROR IN GETTING QUEUQ MSG");
							}else
							{
								console.log("count  of queue msg document "+doc.length);
								if (doc.length > 0) 
								{
									var messagearray = {
									message: []
									};
									
									var objIds = [];
									//MessagequeueSchema.remove({_id:{$in:objIds}});
									
									async.forEachSeries(doc, function(item, callback)
									{
										console.log("****************************************");
										console.log(item);
										 objIds.push(item._id);
										if(item.type ===1 )
										{
											messagearray.message.push({ 
											"userid_to" : item.userId_to,
											"type" : item.type,
											"userid_from"  : item.userId_from,
											"msg_type"       : item.msg_type ,
											"msg_data"       : item.msg_data ,
											"msg_local_id"	 :item.msg_localid,
											"contact_name"   : item.contact_name ,
											"contact_number" :item.contact_number,
											"contact_image" :item.contact_image,
											"msg_server_id"	 :item.msg_serverid
										});
											var messagestatusarray = {messagestatus: []};
											messagestatusarray.messagestatus.push({ 
											"userid_to" : item.to_send,
											"msg_serverid" : 11,
											"msg_local_id"	 :item.msg_localid,
											"msg_status"	 :2
											});	
											var userid_to=item.userId_to;
											
											var localid=item.msg_localid;
											var useridfrom=item.userId_from;
											// console.log("***************************")
											// console.log(localid);
											//Getting Socket id of user whom we have to send mesage status
											UserSchema.find({
											'userId' : item.userId_from
											}, function (err, doc) {
												if(err)
												{
												}else
												{
													if (doc.length > 0)
													{
														var socketid = doc[0].socketId
														if(io.sockets.sockets[socketid]!==undefined)
														{
															 var myarr = '{"message_local_id":"'+localid+'","status":"2","userid_to":"'+userid_to+'"}';
															 io.sockets.socket(socketid).emit("messagestatus", myarr);
															  
														}else
														{
															var newqueuemessage = new MessagequeueSchema({
															type:2,
															userId_to : useridfrom,
															to_send : userid_to,
															msg_localid: localid,
															msg_serverid: 11,
															msg_status:2,
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
										}else
										{
											if(item.type===2)
											{
												messagearray.message.push({ 
												"type" : 2,
												"userid_to" : item.to_send,
												"msg_local_id"	 :item.msg_localid,
												"msg_server_id"	 :item.msg_serverid,
												"msg_status"	 :item.msg_status
										});
											}
										}
									callback();
									},function(){
										
										
									io.sockets.socket(client.id).emit("pendingmessage", messagearray);
									//MessagequeueSchema.remove({_id:{$in:objIds}});
									//doc[0].socketId = socketId;
									//doc[0].save();
									//console.log("socket Id has been updated for user " + userid + "with a new socket Id: " + socketId);
									
									
									MessagequeueSchema.find({_id:{$in:objIds}},function(err,docs){					
									docs.forEach( function (doc) {
									doc.remove();
									});
									
									});
									})
								}else
								{
									console.log("size of documnet is less that zero "+doc.length);
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
								
						}else//if sequence is changes 
						{
						   io.sockets.socket(client.id).emit("SequenceCheck", false);
						}
             }           
         });
		 
		 
		 
		//console.log("query in check sequence "+strQuery)
		//connection.query(strQuery, function (err, rows) {
		//	if (err) 
		//	{
		//		throw err;
		//	} else 
		//	{
						
						
		//	}
		});
		
	});

	client.on("getContactDetails", function (msg) {
	
	//var contact = JSON.parse(msg);
	console.log(" user id get from local user  "+msg);
	var Query = "SELECT * FROM users WHERE userid=" + msg;
	
	pool.getConnection(function(err,connection){
         if (err) {
           connection.release();
           return;
         }   
		connection.query(Query,function(err,rows){
             connection.release();
             if(!err) 
			 {
                io.sockets.socket(client.id).emit("getContactDetailsResponse", rows[0]);
             }           
         });
		//console.log(" query for getting user details  "+Query)
		//connection.query(Query, function (err, rows) {
		//	if (err) {
		//		throw err;
		//	} else 
		//	{
											
				
		//	}
		});
	});
	client.on("sendReadReport", function () {});
	client.on("isUseronline", function () {});

	client.on("disconnect", function () {
        var lastseen = Math.floor(Date.now() / 1000);
        console.log("=================================>" + lastseen);

        UserSchema.find({
            'socketId': client.id
        }, function (err, doc) {
            if (err) {
                return err;
            } else {
                if (doc.length > 0) {
                    doc[0].lastseen = lastseen;
                    doc[0].save();
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
                var myarr = '{"online_status":"0"}';
                if (doc.length > 0) {
                    var socketid = doc[0].socketId;

                    if (io.sockets.sockets[socketid] !== undefined)
                    {
                          myarr = '{"online_status":"1"}';
                        io.sockets.socket(client.id).emit("userOnlineStatus", myarr);
                    }
                    else {
                         myarr = '{"online_status":"0","last_seen":"' + doc[0].lastseen + '"}';
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
        var lastSeenInfo = jsonMsg.contactStatus; 
        pool.getConnection(function (err, connection) {
            if (err)
            {
                console.log(err);
                connection.release();
                return;
            }
            
            var strQuery = "UPDATE users SET contact_status ='" + lastSeenInfo +"' WHERE userid = " + user;
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
	
	//Make mobile number visible/invisible to contact
    client.on("mobileNumberVisibility", function (msg) {
        var jsonMsg = JSON.parse(msg);
        var user = jsonMsg.user_id;
        var numberVisibility = jsonMsg.numberVisibility;  //0 not visible  1 visible

       pool.getConnection(function (err, connection) {
            if (err)
            {
                console.log(err);
                connection.release();
                return;
            }
            
            var strQuery = "UPDATE users SET contact_isnovisible =" + numberVisibility +" WHERE userid = " + user;
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
        var userto_id = jsonMsg.userto_id;     // req. receiving user.
        var request_status = jsonMsg.status;   // 0 for send req. and 3 for cancel req 

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
        var userto_id = jsonMsg.userto_id;     // req. receiving user.
        var request_status = jsonMsg.status;   // 1 for reject req and 2 accept and 3 cancle

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
	
});
