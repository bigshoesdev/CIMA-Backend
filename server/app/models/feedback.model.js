
/**
  *
  * Feedback Model
  */

  var mongoose = require('mongoose');
  var Schema = mongoose.Schema;

  var FeedbackSchema = new Schema({
    user_id: {type: String, required: true},
    title: {type: String, required: true},
    message: {type: String, required: true}
  }); 

  module.exports = mongoose.model('feedback', FeedbackSchema);