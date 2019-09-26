var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var SettingSchema = new Schema({
    title: {
          type: String,
          required: true
        },
    meta_title: { 
         type: String,
         required: true
       },
    meta_description: {
        type: String,
        required: true
    },
    meta_keyword: {
        type: String,
        required: true
    },
	distance: {
        type: Number,
        required: true
    },
    created_date: { type: Date, default: Date.now}
});

module.exports = mongoose.model('Setting',SettingSchema);
