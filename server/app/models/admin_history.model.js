/**
  *
  * Admin Model
  */

  var mongoose = require('mongoose');
  var Schema = mongoose.Schema;

  var AdminHistorySchema = new Schema({
    type: {type: String, required: true},
    date_time: {type: Number},
    action: {type: String},
    notes: {type: String,  "default": ""}  ,
    customer_id: {type: String, required: true},
  });

  module.exports = mongoose.model('admin_history', AdminHistorySchema);  