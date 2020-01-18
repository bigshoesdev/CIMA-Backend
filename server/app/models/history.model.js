
/**
  *
  * History Model
  */

  var mongoose = require('mongoose');
  var Schema = mongoose.Schema;

  var HistorySchema = new Schema({
    user_id: String,
    timestamp: Number,
    detail: Array
  }); 

  module.exports = mongoose.model('history', HistorySchema);