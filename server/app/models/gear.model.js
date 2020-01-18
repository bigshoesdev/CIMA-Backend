
/**
  *
  * Gear Model
  */

  var mongoose = require('mongoose');
  var Schema = mongoose.Schema;

  var GearSchema = new Schema({
    user_id: String,
    gear_type: String,
    shoe_size:String,
    quantity: Number,
    price: Number,
    total_price: Number,
    createdOn: {type: Date, "default": Date.now}
  }); 

  module.exports = mongoose.model('gear', GearSchema);