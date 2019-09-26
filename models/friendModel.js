var mongoose = require('mongoose');
var Schema = mongoose.Schema;
ObjectId = Schema.ObjectId;

var FriendSchema = new Schema({
    send_from_user_id: {
         type: ObjectId,
         ref: 'User'
        },
    send_to_user_id: { 
		 type: ObjectId,
         ref: 'User'
	   },
	request_type:{type: Number,default:1},// 1=>friend request,2=>chat request
	issender:{type: Number,default:1},// 1=>send_from_user_id send request ,0=>send_to_user_id send request
    created_date: { type: Date, default: Date.now},
    status: { type: Number,default:0},// 0=>pending, 1=>accept , 2=>decline
	type:{type: Number,default:1},// 1=>people, 2=>group , 3=>network
});

module.exports = mongoose.model('Friend',FriendSchema);