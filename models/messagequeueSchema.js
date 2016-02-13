console.log("Messagequeue schema has been connected");
var mongoose = require('mongoose');
var messagequeueSchema = new mongoose.Schema({
  type: Number,  //type 1 for msg and type 2 for message status
  to_send:Number,
  send_by:Number,
  userId_to: Number
, userId_from:Number
, msg_type: String
, msg_data: String
, msg_status:Number
, msg_mediaurl:String
, msg_sendtime:String
, msg_localid: Number
, msg_serverid: Number
, timestamp: Number
});
module.exports = mongoose.model('MessagequeueSchema', messagequeueSchema);
