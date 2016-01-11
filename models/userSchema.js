console.log("user schema has been connected");
var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  userId: Number
, socketId: String
, phoneno: String
, lastseen: Number
});

module.exports = mongoose.model('UserSchema', userSchema);