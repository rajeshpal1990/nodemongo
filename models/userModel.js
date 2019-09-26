var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
ObjectId = Schema.ObjectId;

var UserSchema = new Schema({
    username: {
            type: String,
            unique: true,
            required: true
        },
    chatUserName: {
            type: String,
            required: true
     },
    password: {
            type: String,
            required: true
        },
    chatPassword: {
            type: String,
            required: true
    },
    first_name: {
        type: String,
		default: ''
      },
    middle_name:  {
        type: String,
		default: ''
      },
    last_name: {
        type: String,
		default: ''
      },
    email: {
        type: String,
        unique: true,
        required: true
      },
    cover_picture: { type: String,default: 'cover_picture-1522130999872.png'},
	profile_pic: { type: String,default: 'profile_pic-1522671322857.jpeg'},
    profession: { type: String,default: ''},
    education: { type: String,default: ''},
    location: { type: String,default: ''},
    describeme: { type: String,default: ''},
    dob: {
        type: String,
       // required: true
    },
    gender: {
        type: String,
       // required: true
    },
    mobile:{
        type: Number,
       // required: true
    },
  /*  address1:{
        type: String,
        required: true
    },*/
	address1:String,
    address2:String,
    country:{
        type: ObjectId,
        ref: 'Country'
    },
    state:String,
    city:{
        type: String,
       // required: true
    },
    zipcode:String,
    latlong : {
        type: {type: String},
        coordinates : {
            type : [Number],
            index : '2dsphere'
        }
    },
    latitude:{
        type: Number,
        default: 0
    },
    longitude:{ 
        type: Number,
        default: 0
    },
    change_password_status: { type: Number,default: 0},
    verify_email_code: { type: String},
    verify_phone_code: { type: Number},
    verify_status_by_email: { type: Number,default: 1},
    verify_status_by_phone: { type: Number,default: 0},
    status: { type: Number,default: 0},
    device_type: { type: Number,default: 0},//1 means-android 2 means-IOS
    device_id: { type: String,default: ''},
    token_id: { type: String,default: ''},
    create_date: { type: Date, default: Date.now },
    updated_date: { type: Date, default: Date.now },
    user_role: { type: Number,default: 2},//1 means-admin 2 means-Normal
    socialkey: { type: Number,default: 0},//1 means-facebook 2 means-twitter 3 means-gmail
    socialid: { type: String},
    notification_status: { type: Number,default: 1},//1 active to recieve notification, 0 means-no
    geofence_value: { type: Number,default: 12800},//distance in meter

});

UserSchema.pre('save', function (next) {
    var user = this;
    if (this.isModified('password') || this.isNew) {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                return next(err);
            }
            bcrypt.hash(user.password, salt, null, function (err, hash) {
                if (err) {
                    return next(err);
                }
                user.password = hash;
                next();
            });
        });
    } else {
        return next();
    }
});

UserSchema.methods.comparePassword = function (passw, cb) {
    bcrypt.compare(passw, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};

module.exports = mongoose.model('User', UserSchema);