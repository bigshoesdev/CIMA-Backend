
/**
  *
  * Gear Model
  */

  var mongoose = require('mongoose');
  var Schema = mongoose.Schema;

  var PurchaseSchema = new Schema({
    user_id: String,
    timestamp: Number,
    detail: Array
  }); 

  module.exports = mongoose.model('purchase', PurchaseSchema);