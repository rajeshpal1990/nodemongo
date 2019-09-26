var mongoose = require('mongoose');
var Schema = mongoose.Schema;
ObjectId = Schema.ObjectId;

var PostSchema = new Schema({
    user_id: {
         type: ObjectId,
         ref: 'User'
        },
    title: { type: String, required: true},
    description: { type: String},
    visibility: { type: Number},//0,1
    picture: { type: String},
    url_status: { type: Number,default:0},
    text_url: { type: String,default:''},
    event_start_date: { type: Date},
    event_end_date: { type: Date},
    venue: {type: String},
    type: {type: Number, required: true},//1,2,3
    location : {
        type: {type: String},
        coordinates : {
            type : [Number],
            index : '2dsphere',
            required : true
        }
    },
	file_type: {
        type: String,
        enum: ['0','1','2'],
        required: true
	   },//0 mean no file,1 means image,2 means vedio 
    latitute: { type: String, required: true},
    logitute: { type: String, required: true},
    created_date: { type: Date, default: Date.now},
    updated_date: { type: Date, default: Date.now},
    status: { type: Number,default:1},//0,1 or Hide post
});

module.exports = mongoose.model('Post',PostSchema);