var mongoose = require('mongoose');
var Schema = mongoose.Schema;
ObjectId = Schema.ObjectId;

var LikeSchema = new Schema({
    user_id: {
         type: ObjectId,
         ref: 'User',
         required: true
        },
    post_id: { 
         type: ObjectId,
         ref: 'Post',
         required: true
       },
    status: {
        type: Number
    },
    created_date: { type: Date, default: Date.now}
});

module.exports = mongoose.model('Like',LikeSchema);
