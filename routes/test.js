var mongoose = require('mongoose');
var passport = require('passport');
var multer  = require('multer');
var config = require('../config/database');
//require('../config/passport')(passport);

var verifytoken = require('../config/verifytoken');
var router = express.Router();
var jwt = require('jsonwebtoken');
var randomize = require('randomatic');
var nodemailer = require('nodemailer');
var twilio = require('twilio');
var client = twilio('AC9a1071b3280997e29112fea113a11454', '18b281e15bbe1b6f70295dd7a702afcc'); 
var path = require('path');
var fs = require('fs');
var http = require('http');
var root_path = path.resolve();
var User = require("../models/userModel");
var UserGallery = require("../models/usergalleryModel");
var Friend = require("../models/friendModel");
var Book = require("../models/bookModel");
var Post = require("../models/postModel");
var Country = require("../models/countryModel");


var transporter = nodemailer.createTransport({
  service: 'gmail',
// host: 'smtp.gmail.com',
// port: 587,
  //secure: false, // secure:true for port 465, secure:false for port 587
  auth: {
    user: 'jaisingh.iws@gmail.com',
    pass: 'iws123456'
  }
});


var storage =   multer.diskStorage({  
  destination: function (req, file, callback) {  
    callback(null,'./uploads/profileImg');  
  },  
  filename: function (req, file, callback) { 
    profilePictureName = file.fieldname + '-' + Date.now() + path.extname(file.originalname);
    callback(null, profilePictureName);  
  }  
}); 
var uploadProfilePicture = multer({ 
            storage : storage,
            limits:{fileSize: 100000},
            fileFilter: function(req, file, cb){
            checkFileType(file, cb);
            }
     }).single('profile_pic');


var storage =   multer.diskStorage({  
  destination: function (req, file, callback) {  
    callback(null,'./uploads/profileImg');  
  },  
  filename: function (req, file, callback) { 
    coverPictureName = file.fieldname + '-' + Date.now() + path.extname(file.originalname);
    callback(null, coverPictureName);  
  }  
}); 
var uploadCoverPicture = multer({ 
            storage : storage,
            limits:{fileSize: 100000},
            fileFilter: function(req, file, cb){
            checkFileType(file, cb);
            }
    }).single('cover_picture');
  // Check File Type
  function checkFileType(file, cb){
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);
    if(mimetype && extname){
      return cb(null,true);
    } else {
      cb('Error: Images Only!');
    }
  }


/*****************************start Section Registration of user api***************************************/
router.post('/signup',function(req, res) {
  console.log(req.body);
  let mailVerifyCode = randomize('A', 4); 
  let randomPassword = randomize('*', 8);
  let otp = randomize('0', 4);
  var buffer = new Buffer(mailVerifyCode);
  var mailVerifyCodeEncode = buffer.toString('base64');
  if (!req.body.username || !req.body.email) {
    res.json({success: false, msg: 'Please pass username and email Id at least.'});
  } else {

    var name = req.body.first_name;
    var name = name.split(" ").map(function (val) {
      return String(val);
    });
    var len = name.length;
    if(len==1){
      fname = name[0];
      lname = '';
      mname = '';
    }
    if(len==2){
      fname = name[0];
      lname = name[1];
      mname = '';
    }
    if(len==3){
      fname = name[0];
      mname = name[1];
      lname = name[2];
    }
    
    var userName = req.body.username;
    var username = userName.toLowerCase();
    var newUser = new User({
      username: username,
      chatUserName: username,
      password: req.body.password,
      chatPassword: req.body.password,
      first_name: fname,
      middle_name: mname,
      last_name: lname,
      email: req.body.email,
      dob: req.body.dob,
      gender: req.body.gender,
      mobile: req.body.mobile,
      address1: req.body.address1,
      address2: req.body.address2,
      country: req.body.country,
      state: req.body.state,
      city: req.body.city,
      zipcode: req.body.zipcode,
      verify_email_code: mailVerifyCode,
      verify_phone_code: otp,
     });
	  console.log(newUser);
//For inserting data into openfire
      userJsonObject = JSON.stringify({
            username: username,
            password: req.body.password,
            name: req.body.first_name,
            email: req.body.email
        });
         var postheaders = {
          'Content-Type' : 'application/json',
          'Authorization': 'iws123#',
          'Content-Length' : Buffer.byteLength(userJsonObject, 'utf8')
         };
		  var optionspost = {
			host : '67.205.173.26',
			port : 9090,
			path : '/plugins/restapi/v1/users',
			method : 'POST',
			headers : postheaders
		  };
var reqPost = http.request(optionspost, function(response) {
  console.log("statusCode: ", response.statusCode);
  if(response.statusCode==201){

          // save the user
          newUser.save(function(err) {
            if (err) {
              return res.json({success: false, msg: 'User already exists.'});
            }else{
                // start send mail confirmation url and otp
                      let confirmLink = "http://67.205.173.26:3000/api/users/confirmationlink/"+newUser.id+"/"+mailVerifyCodeEncode;
                      let msg ='<div>Dear '+req.body.first_name+',';
                      msg+= '<p>please confirm below Url.</p></div>';
                      msg+= '<a href="'+confirmLink+'">Confirm Url</a>';
                      var mailOptions = {
                        from: 'jaisingh@gmail.com',
                        to: req.body.email,
                        subject: 'Confirmation Link',
                        html: msg
                      };
                      transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                          console.log(error);
                        } else {
                          console.log('Email sent: ' + info.response);
                        }
                      }); 

                    client.messages.create({
                          to:'+919891586938',
                          from:'+13073122971',
                          body:'Your OTP:'+otp
                      }, function(err, message) {
                          if (err) {
                              console.error('Text failed because: '+err.message);
                          } else {
                              console.log('Text sent! Message SID: '+message.sid);
                          }
                      });

                // end send mail confirmation url and otp
             // profileImgPath = root_path+"/uploads/profileImg/"+newUser.profile_pic;
             // newUser.profile_pic = profileImgPath;
              res.json({status: true, data: newUser ,msg: 'Successful created new user.'});
            }
          });
      }
      else if(response.statusCode==500 || response.statusCode==200){
          res.json({status: false, msg: 'User already exists.'});
      } 
      else if(response.statusCode==401){
          res.json({status: false, msg: 'Unauthorized access.'});
      }
    else{
        res.json({status: false, msg: 'Unable to create a user...Please try again'});
    }
    });
    reqPost.write(userJsonObject);
    reqPost.end();
   
  }
});





/*****************************start Section Registration of user by Social api***************************************/
router.post('/signupSocial',function(req, res) {
	var userName = req.body.username;
	var username = userName.toLowerCase();
	 User.findOne( { username:username} ).exec(function( err,user ){
		 if (user) // if user already there then simply return those data
            {
              var tojson = {name:req.body.username};
              const token = jwt.sign(tojson, config.secret, {
                      expiresIn: 604800 // 1 week
               })
              res.json({status:true,data:user,token:token});
		       }
		    else
		    { 
          let mailVerifyCode = randomize('A', 4); 
				  let randomPassword = randomize('*', 8);
				  let otp = randomize('0', 4);
				  var buffer = new Buffer(mailVerifyCode);
				  var mailVerifyCodeEncode = buffer.toString('base64');
				  if (!req.body.username || !req.body.email) {
					res.json({status: false, msg: 'Please pass username and email Id at least.'});
				  } else {

					var first_name = req.body.first_name;
					var last_name = req.body.last_name;
					var userName = username;
					var userName = userName.split(" ").map(function (val) {
						return String(val);
					  });
					 userName = userName[0];

					var username = userName.toLowerCase();
					var newUser = new User({
					  username: username,
					  chatUserName: username,
					  password: randomPassword,
					  chatPassword: randomPassword,
					  first_name: first_name,
					  middle_name: ' ',
					  last_name: last_name,
					  email: req.body.email,
					  dob: ' ',
					  gender: ' ',
					  mobile: ' ',
					  city: ' ',
					  socialkey: req.body.socialkey,
					  socialid: req.body.socialid,
					  verify_status_by_email: 1,
					  verify_status_by_phone: 1,
					  status: 1,
					 });
					  console.log(newUser);


				//For inserting data into openfire
					  userJsonObject = JSON.stringify({
							username: username,
							password: randomPassword,
							name: req.body.first_name,
							email: req.body.email
						});
						 var postheaders = {
						  'Content-Type' : 'application/json',
						  'Authorization': 'iws123#',
						  'Content-Length' : Buffer.byteLength(userJsonObject, 'utf8')
						 };
						  var optionspost = {
							host : '67.205.173.26',
							port : 9090,
							path : '/plugins/restapi/v1/users',
							method : 'POST',
							headers : postheaders
						  };
				var reqPost = http.request(optionspost, function(response) {
				  console.log("statusCode: ", response.statusCode);
				  if(response.statusCode==201){

						  // save the user
						  newUser.save(function(err) {
							if (err) {
							  return res.json({status: false, msg: 'User already exists.'});
							}else{
								// start send mail confirmation url and otp
									  let confirmLink = "http://67.205.173.26:3000/api/users/confirmationlink/"+newUser.id+"/"+mailVerifyCodeEncode;
									  let msg ='<div>Dear '+req.body.first_name+',';
									  msg+= '<p>please confirm below Url.</p></div>';
									  msg+= '<a href="'+confirmLink+'">Confirm Url</a>';
									  var mailOptions = {
										from: 'jaisingh@gmail.com',
										to: req.body.email,
										subject: 'Confirmation Link',
										html: msg
									  };
									  transporter.sendMail(mailOptions, function(error, info){
										if (error) {
										  console.log(error);
										} else {
										  console.log('Email sent: ' + info.response);
										}
									  }); 
							  var tojson = {name:username};
							  const token = jwt.sign(tojson, config.secret, {
								expiresIn: 604800 // 1 week
							  });
							  res.json({status: true, data: newUser ,msg: 'Successful created new user.',token: token});
							}
						  });
					  }
					  else if(response.statusCode==500 || response.statusCode==200){
						  res.json({status: false, msg: 'User already exists.'});
					  } 
					  else if(response.statusCode==401){
						  res.json({status: false, msg: 'Unauthorized access.'});
					  }
					else{
						res.json({status: false, msg: 'Unable to create a user...Please try again'});
					}
					});
					reqPost.write(userJsonObject);
					reqPost.end();

				  }
				
			}
	 });
	
				  
});

/*****************************start Section Edit user Profile of Three Field api***************************************/
router.post('/editProfile',function(req,res) {
  var updateObj = {$set:{profession:req.body.profession,education:req.body.education,location:req.body.location}};
  User.findByIdAndUpdate({_id:req.body.user_id},updateObj,function( err, userupdate){
       if(err){
          res.json({status: false, msg: 'Unable to update.'});
          }
         else
          {
          res.json({status: true, msg: "Your profile data has been updated."});
          }  
   });
});

/*****************************start Section Add or Edit user Cover Picture api***************************************/
router.post('/changeCoverPicture',uploadCoverPicture ,function(req,res) {
  var updateObj = {$set:{cover_picture:coverPictureName}};
  User.findByIdAndUpdate({_id:req.body.user_id},updateObj,function( err, userupdate){
       if(err){
          res.json({status: false, msg: 'Unable to update your cover picture.'});
          }
         else
          {
            fs.unlink("./uploads/profileImg/"+userupdate.cover_picture, function(error) {
              if (error) {
              }
            });
          res.json({status: true, msg: "Your cover picture has been updated."});
          }  
   });
});

/*****************************start Section Add or Edit user Profile Picture api***************************************/
router.post('/changeProfilePicture',uploadProfilePicture ,function(req,res) {
  var updateObj = {$set:{profile_pic:profilePictureName}};
  User.findByIdAndUpdate({_id:req.body.user_id},updateObj,function( err, userupdate){
       if(err){
          res.json({status: false, msg: 'Unable to update your profile picture.'});
          }
         else
          {
            fs.unlink("./uploads/profileImg/"+userupdate.profile_pic, function(error) {
              if (error) {
              }
            });
          res.json({status: true, msg: "Your profile picture has been updated."});
          }  
   });
});
/*****************************start Section Login api***************************************/
router.post('/signin', function(req, res) {
   var userName = req.body.username;
   var username = userName.toLowerCase();
  console.log("hapapycc"+username);
  User.findOne({
    username: username
  }, function(err, user) {
    if (err) throw err;
    
    if (!user) {
      res.json({status: false, msg: 'Authentication failed. User not found.'});
    } 
    else if(user.status==0){ //means user not verified
      res.json({status: false, msg: 'Your account is not active.'});
    }
    else {
      // check if password matches
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          // if user is found and password is right create a token
          var tojson = {name:userName};
          const token = jwt.sign(tojson, config.secret, {
            expiresIn: 604800 // 1 week
          });
          //const token = jwt.sign(user.toJSON(), config.secret, {
          //  expiresIn: 604800 // 1 week
         // });
          // return the information including token as JSON

          var userUpdate= {
            device_type: req.body.device_type,
            token_id: req.body.token_id
        };
          User.update({username: req.body.username},{$set:userUpdate},function( err,post){
               
            });


          res.json({status: true, data: user,token: token});
        } else {
          res.json({status: false, msg: 'Authentication failed. Wrong password.'});
        }
      });
    }
  });
});


/*****************************start Section Verify your otp by Email confirmation Link api***************************************/
router.get('/confirmationlink/:id/:code', function(req, res) {
  let data = req.params.code;  
  let buff = new Buffer(data, 'base64');  
  let mailCode = buff.toString('ascii');
  User.findById(req.params.id,function (err, user) {
    if (err)  res.redirect(config.website_url+'/confirm_email?state=4');
  //  return res.status(500).send({status: false, msg: 'User Id not correct.'});

          if(user.verify_status_by_email==1){
          //  res.status(401).send({status: true, msg: 'Your already verified.'});
            res.redirect(config.website_url+'/confirm_email?state=2');
          }   
          else if(mailCode==user.verify_email_code){
              user.verify_status_by_email = 1;
              if(user.verify_status_by_phone==1){
                user.status = 1;
              }
            user.save(function (err, user) {
              res.redirect(config.website_url+'/confirm_email?state=1');
             // res.status(401).send({status: true, msg: 'Your email confirmation is done.'});
            });
          }
        else
         {
          res.redirect(config.website_url+'/confirm_email?state=3');
          // res.status(401).send({status: false, msg: 'Your confirmation link has been expire.'});
          }
  });
});


/*****************************start Section Verify your otp by phone api***************************************/
router.put('/verifyotp/:id', function(req, res) {
  User.findById(req.params.id,function (err, user) {
    if (err) return res.status(500).send({status: false, msg: 'User Id not correct.'});
   // if(req.body.otp==user.verify_phone_code){
      if(req.body.otp=='1111'){
       user.verify_status_by_phone = 1;
       if(user.verify_status_by_email==1){
        user.status = 1;
       }
       user.save(function (err, user) {
        res.json({status: true, msg: 'Your OTP is verified'});
      });
    }
    else{
        res.json({status: false, msg: 'Your otp code is not correct.'});
     }
  });
});


/*****************************start Section Resend opt by user api***************************************/
router.put('/resendotp/:id', function(req, res) {
   User.findById(req.params.id,function (err, user) {  
     if (err) return  res.status(500).send({status: false, msg: 'User Id not correct.'});
     var a = Math.floor(100000 + Math.random() * 900000)
     otp = a.toString().substring(0, 4);
          client.messages.create({
                to:'+919891586938',
                from:'+13073122971',
                body:'Your OTP:'+otp
            }, function(err, message) {
                if (err)
                {
                 console.error('Text failed because: '+err.message);
                }
               else
                {
                    console.log('Text sent! Message SID: '+message.sid);
                    user.verify_phone_code = otp;
                    user.save(function (err, user) {
                      res.status(401).send({status: true, msg: 'A new OTP has been sent.'});
                    });
                   
                 }
            });
    });
});


/*****************************start Section change password of user api***********************************/
router.put('/changepassword/:id', function(req, res) {
  console.log(req.body);
  User.findById(req.params.id,function (err, user) {
    if (err) return res.status(500).send({status: false, msg: 'User Id not correct.'});
    if(req.body.new_password==req.body.confirm_password){
       user.password = req.body.new_password;
       user.change_password_status = 1;
       user.save(function (err, user) {
        res.json({status: true, msg: 'Your password has been changed.'});
      });
    }
    else{
        res.json({status: false, msg: 'Unable to change your password, Your password is not equal with confirm password.'});
      }
  });
});


/*******************start Section forget password of user: pass email as in form api***************************************/
router.post('/forgetpassword', function(req, res) {
  console.log(req.body.email);
  User.findOne({'email' : req.body.email},function (err, user) {
  if (err) return res.status(500).send({status: false, msg: 'Something wrong.'});
    if(!user){
         res.json({status: false, msg: 'No account with that email address exists.'});
    }
    else{
        let randomPassword = randomize('*', 8);
        let msg ='<div>Dear jai,';
        msg+= '<p>Your password has been changed.please use below password to login.</p></div>';
        msg+= '<p>Your New password is = '+randomPassword;

        user.password = randomPassword;
        user.save(function (err, user) {
            var mailOptions = {
              from: 'jaisingh@gmail.com',
              to: req.body.email,
              subject: 'Forget Password',
              html: msg
            };
            transporter.sendMail(mailOptions, function(error, info){
              console.log(mailOptions);
              if (error) {
                console.log(error);
              } else {
                res.json({status: true, msg: 'Your password has been changed.I have sent password to your email.'});
              }
            }); 
        });
     }
  });
});




/*******************start Section GET All User api***************************************/
/*router.post('/search', function(req, res) {
  var name = req.body.name;
  
  User.find( { $or:[ { username : { $regex : name } }, { first_name : { $regex : name } } ,{ last_name : { $regex : name } } ,{ email : { $regex : name } } ]})
   .exec(function(err, user) {
    
      Post.find( {type : 3 , $or:[ { title : { $regex : name } } ]})
			.populate('user_id')
           .exec(function(err, event) {

         Post.find( {type : 1 , $or:[ { title : { $regex : name } } ]})
				 .populate('user_id')
                 .exec(function(err, post) {
                              if (err)
                                {
                                  res.json({status: false, msg: 'Unable to find People.'});
                                }
                              else
                                {
                                  res.json({status: true, people: user, post: post, event: event});
                                }
                      });

                });
          });
});*/
router.post('/search', function(req, res) {
  var name = req.body.name;
  var user_id = req.body.user_id;
   User.aggregate([
    {
       $match: {       $and: [ {_id: {$nin: [mongoose.Types.ObjectId(user_id)]}} ],
                       $or:[ { username : { $regex : name } }, { first_name : { $regex : name } } ,{ last_name : { $regex : name } } ,{ email : { $regex : name } } ]
               }
    },  
    {
       $lookup://Join user table with friend table
           {
             from: 'friends',
             localField: '_id',
             foreignField: 'send_to_user_id',
             as: 'friends'
           }
    },
    {
      $project: //For getting appropriate field that you want
        {
          username: 1,
          first_name: 1,
          middle_name: 1,
          last_name: 1,
          email: 1,
          profile_pic: 1,
          mobile: 1,
        
          friends: 
          { 
            $filter: 
            { 
              input: "$friends", 
              as: "friend", 
              cond: { $eq: [ "$$friend.send_from_user_id",mongoose.Types.ObjectId(user_id)] } //check user id in friend_user_id field
              ,
            } 
          }
          
        }
   }
     
  ]).exec(function(err, user) {
    
    Post.find( {type : 3 , $or:[ { title : { $regex : name } } ]})
			.populate('user_id')
           .exec(function(err, event) {

         Post.find( {type : 1 , $or:[ { title : { $regex : name } } ]})
				 .populate('user_id')
                 .exec(function(err, post) {
                              if (err)
                                {
                                  res.json({status: false, msg: 'Unable to find People.'});
                                }
                              else
                                {
                                  res.json({status: true, people: user, post: post, event: event});
                                }
                      });

                });
  });    
});


/*******************start Section GET SINGLE User BY ID api***************************************/
router.get('/userProfile/:id', function(req, res, next) {
    User.findById(req.params.id, function (err, user) {
      if (err){
          res.json({status: false, msg: 'Unable to find a user.'});
          }
        else
          {
            res.json({status: true, data: user});
          }
    });
});

/*******************start Section Delete SINGLE User BY ID api***************************************/

router.get('/delete/:id', function(req, res, next) {
    User.findByIdAndRemove(req.params.id, function (err, user) {
       if (err){
          res.json({status: false, msg: 'Unable to delete a user.'});
          }
        else
          {
            res.json({status: true, msg: 'User has been deleted success.'});
          }
    });
});

/*******************Add New Country Into book Collection***************************************/
router.post('/addCountry', function(req, res) {
 var newCountry = new Country({
      country_code: req.body.country_code,
      country_name: req.body.country_name
    });
newCountry.save(function(err) {
      if (err) {
        return res.json({status: false, msg: err+'Save country failed.'});
      }
      res.json({status: true, msg: 'Successful created new country.'});
    });
});


/*******************Get All Country List API***************************************/
router.get('/countryList', function(req, res) {
  Country.find(function(err,countries) {
      if (err) {
        return res.json({status: false, msg: err+'Save country failed.'});
      }
      res.json({status: true, list: countries,});
    });
});

/*******************Delete Country List API***************************************/
router.post('/calculator',function(req, res) {
	let first = req.body.f1;
	let second = req.body.f2;
	first = parseInt(first); // default way (no radix)
	second = parseInt(second); // default way (no radix)
	let add = first+second;
	for(let i=0;i<1000;i++)
	{
		console.log(i);
	}	
	console.log("hello");
    res.json({status: true, msg: "Sum of Two Number is:"+add});
});



/*******************Delete Country List API***************************************/
router.get('/country/:id', function(req, res) {
  Country.findByIdAndRemove({_id: req.params.id},function( err, count){
   if(err) {
    return res.json({status: false, msg: 'Unable to delete it'});
  }
    res.json({status: true, msg: 'Country deleted.'});
  });
});



/*******************Add New Book Into book Collection***************************************/
router.post('/book', verifytoken, function(req, res) {
    var newBook = new Book({
      isbn: req.body.isbn,
      title: req.body.title,
      author: req.body.author,
      publisher: req.body.publisher
    });
 newBook.save(function(err) {
      if (err) {
        return res.json({status: false, msg: 'Save book failed.'});
      }
      res.json({status: true, msg: 'Successful created new book.'});
    });
});


/*******************Get All book List API***************************************/
router.get('/book', verifytoken,function(req, res) {
    Book.find(function (err, books) {
      if (err) return next(err);
      res.json(books);
    });
});

/*-----------------------Send Friend Request Api-------------------------*/
router.post('/sendfriendrequest', function(req, res) {
   if (typeof(req.body.send_to_user_id) != "undefined" && typeof(req.body.send_from_user_id) != "undefined"){
     Friend.find({send_from_user_id:req.body.send_from_user_id,send_to_user_id:req.body.send_to_user_id},function (err, friend) {
         if (err) return next(err);
             if(friend.length==1)
                 {
                   res.json({status: true, msg: 'you have already sent friend request.'});
                 }
             else
                {
                   var newFriend = new Friend({
                    send_from_user_id: req.body.send_from_user_id,
                    send_to_user_id: req.body.send_to_user_id,
                    status: 0 // 0=>pending, 1=>accept , 2=>decline
                    });
                    newFriend.save(function(err) {
                     if (err) {
                       return res.json({status: false, msg: 'Unable to send friend request.'});
                     }
                     res.json({status: true, msg: 'your friend request has been sent.'});
                   });
                }
        });
  }
    else
    {
       res.json({status: false, msg: 'plese send a userID and friend UserID with correct key ....send_from_user_id,send_to_user_id'});
    }
});


/*-----------------------Get All Friend Request that you sent Api-------------------------*/
  /*router.post('/sendFriendList', function(req, res) {
       Friend.findById({user_id: req.params.user_id},function( err, friend){
       if(err) {
        return res.json({status: false, msg: 'Unable to make a list'});
      }
        res.json({status: true, data: friend , msg: 'List of all user that you sent a friend request.'});
      });
  });*/


/*----------------------Get All Friend Request that you received Api-------------------------*/

 router.get('/receiveFriendRequestList/:userid', function(req, res, next) {
      Friend.find({send_to_user_id: req.params.userid,status:0})
      .populate('send_from_user_id')
      .exec(function(err, friend) {
          if (err)
            {
              res.json({status: false, msg: 'Unable to make a list.'});
            }
          else
            {
              res.json({status: true,data: friend, path: "profileImg"});
            }
      });
   });

 

/*----------------------Get All Friend Request that you received Api-------------------------*/
router.post('/changeFriendStatus', function(req, res) {
 let status = req.body.status;
  if(status==1){
      Friend.findByIdAndUpdate({_id:req.body.id},{$set:{status:req.body.status}},function( err, friend){
        if(err) {
          return res.json({status: false, msg: 'Unable to change status.'});
        }
          res.json({status: true, msg: "your status has been changed."});  
        });
  }
  else if(status==2)
  {
     Friend.findByIdAndRemove({_id:req.body.id},function( err, friend){
        if(err) {
          return res.json({status: false, msg: 'Unable to change status.'});
        }
          res.json({status: true, msg: "your status has been changed."});  
        });
   }
  else{
    res.json({status: false, msg: "Please send valid status value eithr 1 or 2."});  
   }
});




/*----------------------List all friend of particular User Api-------------------------*/

 router.get('/friendList/:userid', function(req, res, next) {
      Friend.find({send_from_user_id: req.params.userid,status:1})
      .populate('send_to_user_id')
      .exec(function(err, friend) {
          if (err)
            {
              res.json({status: false, msg: 'Unable to make a list.'});
            }
          else
            {
              res.json({status: true,data: friend, path: "profileImg"});
            }
      });
   });



/*******************start Section GET All User api***************************************/
router.get('/user', function(req, res) {
   User.find((err, user) => {  
      if (err) {
          res.json({status: false, msg: 'No record found.'});
      } else {
         res.json({status: true, data: user});

         
      }
    });
});

/*******************start Section GET User Gallery Detail api***************************************/
    router.get('/getUsergallery/:userid', function(req, res, next) {
        mongoose.connection.db.collection('posts').aggregate([
         { 
           $match : {
                 $and:[ { user_id : mongoose.Types.ObjectId(req.params.userid) },{file_type : "1"} ]

           }
         },
         {
            $project :{
               picture:1
            }
         }
     ])
      .toArray(function(err, post_img) {
          if (err)
            {
              res.json({status: false, msg: 'Unable to update a Post.'});
            }
          else
            {
              res.send({status: true,postImg: post_img,path: 'postImg'});
            }
      });
    });



router.get('/aggregate', function(req, res) {
  
  /*mongoose.connection.db.collection('users').find({}).toArray(function(err, result) {
    if (err) throw err;
    console.log(result);
    res.json({status1: true, data: result});
  });*/ 
  
User.aggregate([
   { $limit : 3 },//Limit this for users collection ...Not in Likes
   { $skip : 1 },//Skip Top 1 record from  users collection ...Not in Likes
   { $sort: {create_date: -1} },//sorting 1- or 1
   {
      $lookup:
       {
         from: 'likes',
         localField: '_id',
         foreignField: 'user_id',
         as: 'likes'
       }
   }
  ]).exec(function(err, result) {
                  if (err)
                    {
                      res.json({status: false, msg: 'Unable to update a Post.'});
                    }
                  else
                    {
                      res.send({status: true,data: result});
                    }
              });


});


  router.post('/getAroundPost1', function(req, res, next) {
     let latitude = req.body.latitude;
     let longtide = req.body.longtide;
      Post.find(
             {
               location:
                 { $near :
                    {
                      $geometry: { type: "Point",  coordinates: [ latitude,longtide ] },
                      $maxDistance: 5000 // 5000 Meters not KM or Miles
                    }
                 }
             }
          )
        .populate('user_id')
        .exec(function(err, post) {
                  if (err)
                    {
                      res.json({status: false, msg: err});
                    }
                  else
                    {
                      res.send({status: true,data: post});
                    }
              });
    });


/*******************start Section GET User Gallery Detail api***************************************/
    router.get('/getUsergallery12/:userid', function(req, res, next) {
        mongoose.connection.db.collection('posts').aggregate([
         { 
           $match : {
                 $and:[ { user_id : mongoose.Types.ObjectId(req.params.userid) },{file_type : "1"} ]

           }
         },
         {
            $project :{
               picture:1
            }
         }
     ])
      .toArray(function(err, post_img) {
          if (err)
            {
              res.json({status: false, msg: 'Unable to update a Post.'});
            }
          else
            {
              res.send({status: true,postImg: post_img,path: 'postImg'});
            }
      });
    });

module.exports = router;