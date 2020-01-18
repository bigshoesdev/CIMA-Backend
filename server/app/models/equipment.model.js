/**
  *
  * Equipment Model
  */

  var mongoose = require('mongoose');
  var Schema = mongoose.Schema;

  var EquipmentSchema = new Schema({
    type: {type: String, required: true},
    size: {type: Array},
    quantity: {type: Number},
    price: {type: Number, "default": 0},
    price5: {type: Number, "default": 0},
    price10: {type: Number,"default": 0},
    onetime_fee: {type: Number}
  });

  module.exports = mongoose.model('equipment', EquipmentSchema);