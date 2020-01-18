
/**
  *
  * History Model
  */

  var mongoose = require('mongoose');
  var Schema = mongoose.Schema;

  var QRCodeSchema = new Schema({
    decimalcode: {type: Number, required: true},
    timestamp: Number,
    detail: {type: String, required: true},
  }); 

  module.exports = mongoose.model('qrcode', QRCodeSchema);