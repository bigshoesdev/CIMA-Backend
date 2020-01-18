
/**
  *
  * User Model
  */

  var mongoose = require('mongoose');
  var Schema = mongoose.Schema;

  var UserSchema = new Schema({
    user_phoneNumber: {type: String, required: true},
    user_email: { type: String},
    user_token: {type: String, required: true},
    user_address: {type: String, "default": ""},
    firstName: {type: String, "default": ""},
    familyName: {type: String, "default": ""},
    birthDate: {type: String},
    nric_passNumber:  {type: String, "default": ""},
    gender:  {type: String, "default": ""},
    guardian_name : {type: String, "default": ""},
    guardian_phoneNumber:  {type: String, "default": ""},
    guardian_relationship:  {type: String, "default": ""},
    emergency_name :  {type: String, "default": ""},
    emergency_phoneNumber:  {type: String, "default": ""},
    emergency_relationship: {type: String, "default": ""},
    picture_avatar: {type: String, "default": ""},
    picture_sign: {type: String, "default": ""},
    pdf_url: {type: String, "default": ""},
    signup_date: {type: String},
    activity_message:  {type: String, "default": ""},
    promo: {type: Boolean, "default": false},
    qualification: {type: Array, "default": []},
    stripe_customerid: {type: String, "default": ""},
    stripe_subscriptionid: {type: String, "default": ""},
    distanceoftime: {type: Number},
    signup_stamp: {type: Number},
    last_visit: {type: String, "default": ""},
    special_note: {type: String, "default": ""},
    sms: {type: String, String, "default": ""}
  }); 
  
  module.exports = mongoose.model('user', UserSchema);