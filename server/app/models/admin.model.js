/**
  *
  * Admin Model
  */

  var mongoose = require('mongoose');
  var Schema = mongoose.Schema;

  var AdminSchema = new Schema({
    name: {type: String, required: true},
    user_name: {type: String},
    user_password: {type: String, required: true},
    user_email: {type: String, required: true, unique: true},
    role: {type: String},
    user_token: {type: String},
    user_avatar: {type: String},
    signin_time: {type: Number}
  });

  module.exports = mongoose.model('admin', AdminSchema);  