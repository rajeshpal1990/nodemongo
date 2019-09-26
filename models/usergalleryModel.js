var mongoose = require('mongoose');
var Schema = mongoose.Schema;
ObjectId = Schema.ObjectId;

var UserGallerySchema = new Schema({
    user_id: {
         type: ObjectId,
         ref: 'User'
        },
	gallery_picture: { type: String},
    created_date: { type: Date, default: Date.now},
    updated_date: { type: Date, default: Date.now},
    ispostImg: { type: Number,default:0},//0,1
    status: { type: Number,default:1},//0,1
});

module.exports = mongoose.model('UserGallery',UserGallerySchema);