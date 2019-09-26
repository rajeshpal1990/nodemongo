var mongoose = require('mongoose');
var Schema = mongoose.Schema;
ObjectId = Schema.ObjectId;

var CommentSchema = new Schema({
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
    comment_text: {
        type: String
    },
    status: {
        type: Number,
        default: 1
    },
    created_date: { type: Date, default: Date.now}
});

module.exports = mongoose.model('Comment',CommentSchema);
