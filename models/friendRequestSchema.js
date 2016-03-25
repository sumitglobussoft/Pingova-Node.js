console.log("FriendRequestSchema has been connected");
var mongoose = require ('mongoose');

var friendRequestSchema = new mongoose.Schema({
userId : Number,
friendUserId : Number,
status : Number
, timestamp: Number
});
friendRequestSchema.index( { userId: 1, friendUserId: 1 }, { unique: true } );
module.exports = mongoose.model ('FriendRequestSchema',friendRequestSchema);