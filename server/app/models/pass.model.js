
/**
  *
  * Pass Model
  */

  var mongoose = require('mongoose');
  var Schema = mongoose.Schema;

  var PassSchema = new Schema({
    user_id: String,
    pass_type: String,
    from: Number,
    to: Number,
    available: {type: Boolean, "default": true},
    status: {type: String, "default": ""},
    remain_count: Number,
    out_dayPass: {type: Array, "default": []},
    freeze_from: {type: String, "default": ""},
    freeze_to: {type: String, "default": ""},
    terminate: {type: String, "default": ""},
    season_status: {type: String, "default": ""}
  }); 

  module.exports = mongoose.model('pass', PassSchema);