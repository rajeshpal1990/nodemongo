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
const sgMail = require('@sendgrid/mail');
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

var coverPictureName = '';
var profilePictureName = '';
var chatPictureName = '';
/*****************************Upload image section for profile Picture***************************************/
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
/*****************************Upload image section for cover Picture***************************************/
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

/*****************************Upload image section for gallery Picture***************************************/
var storage =   multer.diskStorage({  
  destination: function (req, file, callback) {  
    callback(null,'./uploads/galleryImg');  
  },  
  filename: function (req, file, callback) { 
    galleryPictureName = file.fieldname + '-' + Date.now() + path.extname(file.originalname);
    callback(null, galleryPictureName);  
  }  
}); 
var uploadGalleryPicture = multer({ 
            storage : storage
    }).array('gallery_picture',10);

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

/*****************************Upload Chatting picture***************************************/

var storage =   multer.diskStorage({  
  destination: function (req, file, callback) {  
    callback(null,'./uploads/chatImg');  
  },  
  filename: function (req, file, callback) { 
    chatPictureName = file.fieldname + '-' + Date.now() + path.extname(file.originalname);
    callback(null, chatPictureName);  
  }  
});

var uploadChattingPicture = multer({ 
            storage : storage,
            limits:{fileSize: 10000000},
            fileFilter: function(req, file, cb){
            checkFileType(file, cb);
            }
     }).single('chat_pic');



/*****************************start Section Registration of user api***************************************/
 router.post('/signup',function(req, res) {
  
  var username = req.body.username;
  var email = req.body.email;
  var mobile = req.body.mobile;
   User.find({ $or : [ { "username":username},{"email":email},{"mobile":mobile} ] } ,function( err,user){
            if (err)
             res.json({status: false, msg: 'Something went wrong.'});
             
                if(user.length>=1)
                {
                 res.json({status: false, msg: 'User already exists`.'});
                }
                else
                {   
                let mailVerifyCode = randomize('A', 4); 
                let randomPassword = randomize('*', 8);
                let otp = randomize('0', 4);
                var buffer = new Buffer(mailVerifyCode);
                var mailVerifyCodeEncode = buffer.toString('base64');
                if (!req.body.username || !req.body.email) {
                  res.json({success: false, msg: 'Please pass username and email Id at least.'});
                } else {

                  var first_name = req.body.first_name;
                  var last_name = req.body.last_name;
                  
                  var userName = req.body.username;
                  var fname = first_name;
                  var emailId = req.body.email;
                  var username = userName.toLowerCase();
                  var newUser = new User({
                    username: username,
                    chatUserName: username,
                    password: req.body.password,
                    chatPassword: req.body.password,
                    first_name: first_name,
                    middle_name: ' ',
                    last_name: last_name,
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
                          username: req.body.mobile,
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
                    console.log("jjfff");

                          if (err) {
                                         var postheaders = {
                                          'Content-Type' : 'application/json',
                                           'Authorization': 'iws123#',
                                           };
                                          var optionspost = {
                                          host : '67.205.173.26',
                                          port : 9090,
                                          path : '/plugins/restapi/v1/users/'+username,
                                          method : 'DELETE',
                                          headers : postheaders
                                          };
                                          var req = http.request(optionspost, function(res) {
                                          console.log('STATUS: ' + res.statusCode);// 200 for success of deletion
                                        }).end();
                            return res.json({success: false, msg: 'User already exists.'});
                          }else{
                            console.log("jj");
                              // start send mail confirmation url and otp
                                            let rooturl = process.env.rootUrl;
                                            let confirmLink = rooturl+"/api/users/confirmationlink/"+newUser.id+"/"+mailVerifyCodeEncode;
                                            let msg ='<div>Dear '+first_name+',';
                                            msg+= '<p>Please confirm below Url.</p></div>';
                                            msg+= '<a href="'+confirmLink+'">'+confirmLink+'</a>';				    
                                            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                            const msgdata = {
                                            to: emailId,
                                            //to: 'jaisingh.iws@gmail.com',
                                            from: 'phase@example.com',
                                            subject: 'Confirmation Link',
                                            text: 'Node.js',
                                            html: msg,
                                            };
                                            sgMail.send(msgdata);
                                   // end send mail confirmation url and otp
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
                  reqPost.end(); }

                }
         
                 
    });
});




/*****************************start Section Registration of user by Social api***************************************/
router.post('/signupSocial',function(req, res) {
	var userName = req.body.username;
	var email = req.body.email;
	var username = userName.toLowerCase();
	var email = email.toLowerCase();
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
					var userName = req.body.username;
					var username = userName.toLowerCase();
					var newUser = new User({
					  username: username,
					  chatUserName: username,
					  password: randomPassword,
					  chatPassword: randomPassword,
					  first_name: first_name,
					  middle_name: '',
					  last_name: last_name,
					  email: email,
					  dob: '',
					  gender: '',
					  city: '',
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
				 // if(1){

						  // save the user
            
						  newUser.save(function(err) {
							if (err) {
                console.log("happyError"+err);
							  return res.json({status: false, msg: 'User already exists`.'});
							}else{
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




/*****************************start Section Login api***************************************/
router.post('/checkUserExist', function(req, res) {
   var username = req.body.username;//any value either username,email or mobile number
   var key = req.body.key;//1=>username,2=>email,3=>mobile number
  
	  if(key==1){
			username = username.toLowerCase();
			var condition =  { "username":username};
		    var keyInfo = "Username";
	  }
	  else if(key==2){
			username = username.toLowerCase();
			var condition =  { "email":username};
		    var keyInfo = "Email Id";
	  }	
	  else
	  {
		   username = username;
		   var condition =  { "mobile":username};
		   var keyInfo = "Mobile Number";
	  }
  User.findOne(condition, function(err, user) {
    if (err) throw err;

    if (!user){
      res.json({status: true, msg: 'Available.'});
    } 
    else{
         res.json({status: false, msg: keyInfo+' already exists.'});
         }
      });
});


/*****************************start Section Login api***************************************/
router.post('/signin', function(req, res) {
   var username = req.body.username;
   if(isNaN(username)){
    var username = username.toLowerCase();
     console.log("string");
     var mobileNumber =0000000000;
   }
  else
   {
      var mobileNumber =username;
      var username =username;
   }
  console.log(username);
  User.findOne({ $or: [{ "username":username},{ "email":username},{ "mobile":mobileNumber}]}, function(err, user) {
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
          var tojson = {name:username};
          const token = jwt.sign(tojson, config.secret, {
            expiresIn: 604800 // 1 week
          });
          //const token = jwt.sign(user.toJSON(), config.secret, {
          //  expiresIn: 604800 // 1 week
         // });
          // return the information including token as JSON

          var userUpdate= {
            device_type: req.body.device_type,
            device_id: req.body.device_id,
            token_id: req.body.token_id,
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            latlong : {
                type : 'Point',
                coordinates : [req.body.latitude,req.body.longitude],
            },
          };
          User.findByIdAndUpdate({_id: user._id},{$set:userUpdate},function( err,user){
             User.findOne({ $or: [{ "username":username},{ "email":username},{ "mobile":mobileNumber}]}, function(err, user) {
                   res.json({status: true, data: user,token: token});
                });
            });


        } else {
          res.json({status: false, msg: 'Authentication failed. Wrong password.'});
        }
      });
    }
  });
});


router.post('/changePassword', function(req, res) {
  console.log(req.body);
  User.findById({_id: req.body.userid},function (err, user) {
    if (err) 
        {
          return res.json({status: false, msg: 'User id not found.'});
        }
    else
      {
          user.comparePassword(req.body.password, function (err, isMatch) {
             if (isMatch && !err) {
                    if(req.body.new_password==req.body.confirm_password){
                       user.password = req.body.new_password;
                       user.change_password_status = 1;
                       user.save(function (err, user) {
                        res.json({status: true, msg: 'Your password has been changed.'});
                      });
                    }
                    else
                      {
                        res.json({status: false, msg: 'Unable to change your password, Your password is not equal with confirm password.'});
                      }
              }// is match if close
             else
              {
                res.json({status: false, msg: 'Your current password is wrong.'});
              }
         });//compare password close
      }//else part close
  });
});




/*****************************start Section Edit user Profile of Three Field api***************************************/
router.post('/describeme',function(req,res) {
  var updateObj = {$set:{describeme:req.body.describeme}};
  User.findByIdAndUpdate({_id:req.body.user_id},updateObj,function( err, userupdate){
       if(err){
          res.json({status: false, msg: 'Unable to update.'});
          }
         else
          {
          res.json({status: true, msg: "Your description has been updated."});
          }  
   });
});


/*****************************start Section Edit user Profile of Three Field api***************************************/
router.post('/editProfile',function(req,res) {
  var updateObj = {$set:{profession:req.body.profession, education:req.body.education, location:req.body.location}};
  User.findByIdAndUpdate({_id:req.body.user_id}, updateObj, function( err, userupdate){
       if(err){
          res.json({status: false, msg: 'Unable to update.'});
          }
         else
          {
          res.json({status: true, msg: "Your profile data has been updated."});
          }  
   });
});

/*****************************start Section Edit user profession***************************************/

router.post('/editProfession', function(req,res) {
  var updateObj = {$set:{profession:req.body.profession}};
  User.findByIdAndUpdate({_id:req.body.user_id}, updateObj, function( err, profupdate){
       if(err){
          res.json({status: false, msg: 'Unable to update.'});
          }
         else
          {
          res.json({status: true, msg: "Your profession has been updated."});
          }  
   });
});

/*****************************start Section Edit user Education***************************************/

router.post('/editEducation', function(req,res) {
  var updateObj = {$set:{education:req.body.education}};
  User.findByIdAndUpdate({_id:req.body.user_id}, updateObj, function( err, educupdate ){
       if(err){
          res.json({status: false, msg: 'Unable to update.'});
          }
         else
          {
          res.json({status: true, msg: "Your Education has been updated."});
          }  
   });
});

/*****************************start Section Edit user Location***************************************/

router.post('/editLocation',function(req,res) {
  var updateObj = {$set:{location:req.body.location}};
  User.findByIdAndUpdate({_id:req.body.user_id},updateObj,function( err, locaupdate ){
       if(err){
          res.json({status: false, msg: 'Unable to update.'});
          }
         else
          {
          res.json({status: true, msg: "Your Location has been updated."});
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
          res.json({status: true, msg: "Your cover picture has been updated.",imgName:coverPictureName});
          }  
   });
});

/*****************************start Section Add chat Picture api***************************************/
router.post('/chatPicture',uploadChattingPicture ,function(req,res) {
 res.json({
   status:true,
   img_path:'http://67.205.173.26:3000/chatImg/'+ chatPictureName,
   msg:'Get Chat Image Name'
 })
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
          res.json({status: true, msg: "Your profile picture has been updated.",imgName:profilePictureName});
          }  
   });
});



/*****************************start Section Verify your otp by Email confirmation Link api***************************************/
router.get('/confirmationlink/:id/:code', (req, res)=>{
  let data = req.params.code;  
  let buff = new Buffer(data, 'base64');  
  let mailCode = buff.toString('ascii');
  User.findById(req.params.id,function (err, user) {
  if (err)  res.redirect(process.env.confirmBaseUrl+'/confirm_email?state=4');
  //  return res.status(500).send({status: false, msg: 'User Id not correct.'});

          if(user.verify_status_by_email==1){
            //console.log(process.env.confirmBaseUrl+'/confirm_email?state=2');
           // res.status(401).send({status: true, msg: 'Your already verified.'});
           res.redirect(process.env.confirmBaseUrl+'/confirm_email?state=2');
          }   
          else if(mailCode==user.verify_email_code){
              user.verify_status_by_email = 1;
              if(user.verify_status_by_phone==1){
                user.status = 1;
              }
            user.save(function (err, user) {
              res.redirect(process.env.confirmBaseUrl+'/confirm_email?state=1');
             // res.status(401).send({status: true, msg: 'Your email confirmation is done.'});
            });
          }
        else
         {
          res.redirect(process.env.confirmBaseUrl+'/confirm_email?state=3');
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
        res.json({status: true, msg: 'Your OTP is verified, Please also verify your email.'});
      });
    }
    else{
        res.json({status: false, msg: 'Your otp code is not correct.'});
     }
  });
});


/*****************************start Section Resend opt by user api***************************************/
router.post('/reSendMailVerification', function(req, res) {
   let userid = req.body.userid;
   let emailId = req.body.email;
   let first_name = req.body.first_name;
   let mailVerifyCode = randomize('A', 4); 
   let randomPassword = randomize('*', 8);
   let otp = randomize('0', 4);
   var buffer = new Buffer(mailVerifyCode);
   var mailVerifyCodeEncode = buffer.toString('base64');
   User.findById({_id:userid},function (err, user) {  
            // start send mail confirmation url and otp
                    let rooturl = process.env.rootUrl;
                    let confirmLink = rooturl+"/api/users/confirmationlink/"+userid+"/"+mailVerifyCodeEncode;
                    let msg ='<div>Dear '+first_name+',';
                    msg+= '<p>Please confirm below Url.</p></div>';
                    msg+= '<a href="'+confirmLink+'">'+confirmLink+'</a>';				    
                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                    const msgdata = {
                    to: emailId,
                    //to: 'jaisingh.iws@gmail.com',
                    from: 'phase@example.com',
                    subject: 'Confirmation Link',
                    text: 'Node.js',
                    html: msg,
                    };
                   sgMail.send(msgdata);
                   console.log(user);
                   if(user){
                      res.json({status: true, msg: 'Plaese verify your email.'});
                   }else{
                      res.json({status: true, msg: 'your email id not valid.'});
                   }
             // end send mail confirmation url and otp
    });
});



/*****************************start Section Resend email verification by user api***************************************/
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

/*******************start Section forget password of user: pass email as in form api***************************************/
router.post('/forgetpassword', function(req, res) {
  console.log(req.body.email);
  var emailId = req.body.email;
  User.findOne({'email' : req.body.email},function (err, user) {
  if (err) return res.status(500).send({status: false, msg: 'Something wrong.'});
    if(!user){
         res.json({status: false, msg: 'No account with that email address exists.'});
    }
    else{
        let randomPassword = randomize('*', 8);
        let msg ='<div>Dear '+user.first_name+',';
        msg+= '<p>Your password has been changed.please use below password to login.</p></div>';
        msg+= '<p>Your New password is- '+randomPassword;

        user.password = randomPassword;
        user.save(function (err, user) {
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          const msgdata = {
          to: emailId,
         // to: 'jaisingh.iws@gmail.com',
          from: 'phase@example.com',
          subject: 'Forget Password',
          text: 'Node.js',
          html: msg,
          };
          sgMail.send(msgdata);
            if (err) {
                console.log(err);
              } else {
                res.json({status: true, msg: 'Your password has been changed.I have sent password to your email.'});
              }
        });
     }
  });
});



router.post('/search', function(req, res) {
  var name = req.body.name;
  var user_id = req.body.user_id;
   User.aggregate([
    {
       $match: {      
                 $and: [ {user_role:2},{_id: {$nin: [mongoose.Types.ObjectId(user_id)]}} ],
                 $or:[{username : { $regex : name } }, { first_name : { $regex : name } } ,{ last_name : { $regex : name } } ,{ email : { $regex : name } } ]
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
                                  res.json({status: true, path:'http://67.205.173.26:3000/profileImg/', people: user, post: post, event: event});
                                }
                      });

                });
  });    
});


/*******************start Section GET SINGLE User BY ID api***************************************/

router.get('/userProfile/:id', function(req, res, next) {
	   User.findOne({_id:req.params.id})
      .populate('country')
      .exec(function(err, user) {
          if (err)
            {
              res.json({status: false, msg: 'Unable to find a user.'});
            }
          else
            {
              res.json({status: true, data: user, path: "profileImg"});
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
        return res.json({status: false, msg:'Save country failed.'});
      }
      res.json({status: true, list: countries,});
    });
});


/*-----------------------Send Unfriend Request Api-------------------------*/
router.post('/sendUnFriendRequest', function(req, res) {
   if (typeof(req.body.userid) != "undefined" && typeof(req.body.frienduserid) != "undefined"){
     var userid_objectId_formate = mongoose.Types.ObjectId(req.body.userid);
     var frienduserid_objectId_formate = mongoose.Types.ObjectId(req.body.frienduserid);
     Friend.find({
            $or : 
               [
                  { $and: [
                            {"send_from_user_id": userid_objectId_formate},
                            {"send_to_user_id": frienduserid_objectId_formate},
                            {"request_type": 1}
                          ]
                  },
                  { $and: [
                            {"send_from_user_id": frienduserid_objectId_formate},
                            {"send_to_user_id": userid_objectId_formate},
                            {"request_type": 1}
                          ]
                  }
               ] 
              }).remove().exec(function(err, unfriend) {
                       if (err) throw err;
                       if (unfriend){
                          res.json({status: true, msg:'Your unfriend request has been successfully sent.'});
                        } 
                        else
                        {
                          res.json({status: false, msg:'Unable to process your unfriend request.'});
                        }
                   }); 
    }
    else
    {
       res.json({status: false, msg: 'Please send valid userid.'});
    }
});

/*-----------------------Send Friend Request Api-------------------------*/
router.post('/sendfriendrequest', function(req, res) {
   if (typeof(req.body.send_to_user_id) != "undefined" && typeof(req.body.send_from_user_id) != "undefined"){
     Friend.find({send_from_user_id:req.body.send_from_user_id,send_to_user_id:req.body.send_to_user_id,request_type:req.body.request_type},function (err, friend) {
         if (err) return next(err);
             if(friend.length==1)
                 {
					if(req.body.request_type==1)
					    var state = "Friend";
				    else
						var state = "Chat";
                    res.json({status: true, msg: `You have already sent ${state} request.`});
                 }
             else
                {
					if(req.body.request_type==1)
					    var state = "Friend";
				    else
						var state = "Chat";
                   var newFriend = new Friend({
                    send_from_user_id: req.body.send_from_user_id,
                    send_to_user_id: req.body.send_to_user_id,
                    request_type: req.body.request_type,// 1=>friend request,2=>chat request
                    issender: 1, // 1=>send_from_user_id send request ,0=>send_to_user_id send request
                    status: 0 // 0=>pending, 1=>accept , 2=>rejected
                    });
                    newFriend.save(function(err) {
                     if (err) {
                       return res.json({status: false, msg: `Unable to send ${state} request.`});
                     }else{
                     res.json({status: true, msg: `Your ${state} request has been sent.`});
					 }
                   });
                }
        });
  }
    else
    {
       res.json({status: false, msg: 'Please send a userID and friend UserID with correct key ....send_from_user_id,send_to_user_id'});
    }
});


/*----------------------Get All Friend Request that you received Api-------------------------*/

 router.get('/receiveFriendRequestList/:userid', function(req, res, next) {
      Friend.aggregate([
		   { 
				$match : { "send_to_user_id" : mongoose.Types.ObjectId(req.params.userid),status:0}
		   } ,
		   {
              $lookup : 
				  {
					from: 'users',
					localField: 'send_from_user_id',
					foreignField: '_id',
					as: 'user'
				  }
          },
		  {
            $unwind: "$user"
          },
		 {
			 $project: //For getting appropriate field that you want
				{
          _id: 1,
          status: 1,
          created_date: 1,
          request_type: 1,
          type: 1,
          send_from_user_id: 1,
          send_to_user_id: 1,
				  user_id: "$user._id",
				  profile_pic: "$user.profile_pic",
				  username: "$user.username",
				  mobile: "$user.mobile",
				  chatPassword: "$user.chatPassword",
				  email: "$user.email",
				  first_name: "$user.first_name",
				  middle_name:"$user.middle_name",
				  last_name: "$user.last_name",
				 }
          },
		 ])
		.sort({created_date:-1})
        .exec(function(err, friend) {
                  if (err)
                    {
                       res.json({status: false, msg: 'Unable to make a list.'});
                    }
                  else
                    {
                       res.json({status: true,data: friend, path: "http://67.205.173.26:3000/profileImg/", profile: 'profileImg'});
                    }
              });
    });




/*----------------------Change Friend Request that you received Api-------------------------*/
router.post('/changeFriendStatus', function(req, res) {
  let status = req.body.status;
  if(status==1){
          Friend.findByIdAndUpdate({_id:req.body.id},{$set:{status:req.body.status}},function( err, friend){// To change the status
            if(err) {
                 return res.json({status: false, msg: 'Unable to change status.'});
            }
            else
            { 
             /* start if there is a friend of A to B then it should friend of B to A that's why we create new row for opposite 
                to above response.
                */   
               var send_to_user_id = friend.send_to_user_id;
               var request_type = friend.request_type;
               var send_from_user_id = friend.send_from_user_id;
               var send_to_user_id_with_objectId_formate = mongoose.Types.ObjectId(friend.send_to_user_id);
               var send_from_user_id_with_objectId_formate = mongoose.Types.ObjectId(friend.send_from_user_id);
               Friend.find({
                   $and : [ { "send_from_user_id":send_to_user_id_with_objectId_formate,"send_to_user_id":send_from_user_id_with_objectId_formate,"request_type": 1} ] 
                 }).remove().exec(function(err, friendFind) {
                       if (err) throw err;
                       if (friendFind){
                         createFriendListOfViseVersa();//This will create new friend after deleting
                        } 
                        else
                        {
                          createFriendListOfViseVersa();//This will create new friend 
                        }
                   }); 
                     
                  function createFriendListOfViseVersa(){
                         let newFriend = new Friend({
                          send_from_user_id: send_to_user_id,
                          send_to_user_id: send_from_user_id,
                          request_type: request_type,// 1=>friend request,2=>chat request
                          issender: 0, // 1=>send_from_user_id send request ,0=>send_to_user_id send request
                          status:1
                          });
                         newFriend.save(function(err){
							 if(request_type==1){
								 var state = "Friend";
							 }
							 else{
								 var state = "Chat";
							 }
                                res.json({status: true, msg: `Your ${state} request accepted.`}); 
                         });
                  }
            /* End if there is a friend of A to B then it should friend of B to A that's why we create new row for opposite 
                to above response.
                */
            }
         });
   }
  else if(status==2)// if status 2 send then it will delete from list
  {
     Friend.findByIdAndRemove({_id:req.body.id},function( err, friend){
        if(err) {
          return res.json({status: false, msg: 'Unable to change status.'});
        }
        {
           console.log(friend);
           var send_to_user_id_with_objectId_formate = mongoose.Types.ObjectId(friend.send_to_user_id);
           var send_from_user_id_with_objectId_formate = mongoose.Types.ObjectId(friend.send_from_user_id);
           Friend.find({
             $and : [ { "send_from_user_id":send_to_user_id_with_objectId_formate,"send_to_user_id":send_from_user_id_with_objectId_formate,"request_type": 2} ] 
             }).remove().exec(function(err, friendFind) {
                 if (err) throw err;
            });
          res.json({status: true, msg: "Friend request rejected."}); 
        }
      });
   }
  else{
    res.json({status: false, msg: "Please send valid status value either 1 or 2."});  
   }
});

/*----------------------List all friend of particular User Api-------------------------*/

  
  
router.get('/friendList/:userid', function(req, res, next) {
     Friend.aggregate([
       { 
         $match : { send_from_user_id : mongoose.Types.ObjectId(req.params.userid) ,status:1,request_type:1}
       },
       {
        $lookup://Join user table with friends table
           {
             from: 'users',
             localField: 'send_to_user_id',
             foreignField: '_id',
             as: 'user'
           }
       },
       {"$unwind": "$user"},
       {
         $project: //For getting appropriate field that you want
          {
          created_date:1,
          my_user_id: "$send_from_user_id",
          friend_user_id: "$user._id",
          cover_picture: "$user.cover_picture",
		      profile_pic: "$user.profile_pic",
		      profession: "$user.profession",
		      education: "$user.education",
		      location: "$user.location",
		      describeme: "$user.describeme",
          username: "$user.username",
          email: "$user.email",
          first_name: "$user.first_name",
		      middle_name:"$user.middle_name",
          last_name: "$user.last_name",
           }
       },
     ]).sort({created_date:-1})
      .exec(function(err, friend) {
          if (err)
            {
              res.json({status: false, msg: 'Unable to find friend list.'});
            }
          else
            {
              res.json({status: true, data: friend, path: "http://67.205.173.26:3000/profileImg/", profile: "profileImg"});
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
    }).sort({create_date:-1}); 
});


/*******************start Section GET All User api***************************************/
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


/*******************start Section Change Profile Setting***************************************/
router.post('/profileSetting', function(req, res, next) {
   
  var name = req.body.first_name;
      if(name!=''){
              var name = name.split(" ").map(function (val) {
                return String(val);
              });
                var fname;
                var lname;
                var len = name.length;
                if(len==1){
                  fname = name[0];
				  var updateData = { first_name: fname }
                }
                else{
                  fname = name[0];
                  lname = name[1];
				  var updateData = { first_name: fname,last_name:lname }
                }
              
              User.findByIdAndUpdate({_id: req.body.userid},updateData, function (err, user) {
                if (err){
                    res.json({status: false, msg: 'Unable to update your setting.'});
                    }
                  else
                    {
                      res.json({status: true, msg: "Your profile setting has been saved."});
                    }
              });
       }else
       {
           res.json({status: false, msg: "This field is required."});
       }
});

/*******************start Section Account Setting***************************************/
router.post('/accountSetting', function(req, res, next) {
    var updateData = { geofence_value: req.body.geofence_value*1600 }
    User.findByIdAndUpdate({_id: req.body.userid},updateData, function (err, user) {
      if (err){
          res.json({status: false, msg: 'Unable to update your setting.'});
          }
        else
          {
            res.json({status: true, msg: "Your account setting has been saved."});
          }
    });
});

/*******************start Section Notification Setting***************************************/
router.post('/notificationSetting', function(req, res, next) {
    var updateData = { notification_status: req.body.notification_status }
    User.findByIdAndUpdate({_id: req.body.userid},updateData, function (err, user) {
      if (err){
          res.json({status: false, msg: 'Unable to update your setting.'});
          }
        else
          {
            res.json({status: true, msg: "Your notification setting has been saved."});
          }
    });
});
/*******************start Section GET User Gallery Detail api***************************************/
 router.get('/getUsergallery/:userid', function(req, res, next) {
       UserGallery.find({user_id: req.params.userid,status:1})
      .exec(function(err, gallery) {
          if (err)
            {
              res.json({status: false, msg: 'Unable to find gallery images.'});
            }
          else
            {
              res.json({status: true,data: gallery, path: "galleryImg"});
            }
      });
    });
/*******************End Section GET User Gallery Detail api***************************************/


/*******************start Insert User Gallery Image into Gallery Collection api***************************************/
router.post('/uploadGallery',uploadGalleryPicture,function(req,res) {
       let filesInfo = req.files;
       let savedata = [];
       filesInfo.forEach( function(item, index) {
           let galleryImg ={};
           galleryImg.user_id = req.body.user_id;
           galleryImg.gallery_picture= item.filename;
           savedata.push(galleryImg);
      });

     UserGallery.create(savedata,function(err){
            if (err)
              {
                res.json({status: false, msg: 'Unable to upload your image.'});
              }
              else
              {
                res.json({status: true, msg: 'Gallery image has been successfully uploaded.'});
              }
        });
});
/*******************End Insert User Gallery Image into Gallery Collection api***************************************/


/*******************start Delete Gallery Image From Gallery Collection api***************************************/
router.get('/deleteGallery/:id',function(req,res) {
     UserGallery.findByIdAndRemove({_id:req.params.id},function( err, gallery){
          if(err) {
            return res.json({status: false, msg: 'Unable to delete gallery image.'});
          }
          else
          {
             console.log(gallery);
             fs.unlink('./uploads/galleryImg/'+gallery.gallery_picture, function() {
                  return res.json({status: true, msg: "Your gallery image has been deleted successfully."});  
                });
          }
   });
});
/*******************End Delete Gallery Image From Gallery Collection api***************************************/


/*****************************Start Section Find  AROUND User ANd friend only public API***************************/
 router.post('/getChatUser', async (req, res, next) => {
     let latitude = req.body.latitude;
     let longitude = req.body.longitude;
     let userid = req.body.userid;
     let geofence = req.body.geofence;
	 geofence =  Number(geofence);
	 if(geofence==0){
         geofence = 50;
      }
     try {
             var friendUser = await getFriendList();
             var aroundUser = await getAroundUser();
             const promises = friendUser.map(removeFriendUserFromAroundUserArray);
             await Promise.all(promises);
		 	 //console.log(aroundUser);

             /*var aroundUser = aroundUser.filter(async(auser, index, object)=>{
				 console.log(userid);
				 console.log(auser._id);
                 if( userid==auser._id){
                         return auser;                   
			     }
             });
             await Promise.all(aroundUser);*/
             res.json({status: true, friendUserList: friendUser ,aroundUserList: aroundUser,profile: "profileImg", path:'http://67.205.173.26:3000/profileImg/'});  
        } 
     catch (e){
           res.json({status: false, msg: 'Unable to get user list.'});
      }
   
	   async function removeFriendUserFromAroundUserArray(fuser){
			  aroundUser.forEach(function(auser, index, object) {
						if(fuser.username==auser.username){
							object.splice(index, 1);
					 }
			  });
		}
 
  function getAroundUser()
                  {
                      return User.aggregate([
                      {
                       
					     $geoNear: {
										near: { type: "Point", coordinates: [ 28.6155904 , 77.3634076 ] },
										distanceField: "distance",
										maxDistance: geofence,
										query: { status: 1 },
										includeLocs: "dist.latlong",
										num: 500,
										spherical: true
									 }
                      },
                      {
                           $lookup : 
                              {
                                from: 'friends',
                                localField: '_id',
                                foreignField: 'send_to_user_id',
                                as: 'friend'
                              }
                      },
                      {
                        $project: //For getting appropriate field that you want
                          {
                          created_date:1,
                          profile_pic:1,
                          cover_picture:1,
                          profile_pic:1,
                          profession:1,
                          education:1,
                          describeme:1,
                          username:1,
                          mobile:1,
                          chatPassword:1,
                          email:1,
                          first_name:1,
                          middle_name:1,
                          last_name:1,
                          distance:1,
                          friend: 
                              { 
                                $filter: 
                                { 
                                  input: "$friend", 
                                  as: "friend", 
                                  cond: { $and: [ { $eq: [ "$$friend.request_type", 2 ] },{ $eq: [ "$$friend.send_from_user_id", mongoose.Types.ObjectId(req.body.userid) ] } ] } //check user id in friend_user_id field
                                }
                              },
                          }
                       },

                      ]).sort({created_date:-1})
                        .exec();
                  }
    
 function getFriendList()
    {
     return Friend.aggregate([
           { 
             $match : { send_from_user_id : mongoose.Types.ObjectId(userid) ,status:1,request_type:1}
           },
           {
            $lookup://Join user table with friends table
               {
                 from: 'users',
                 localField: 'send_to_user_id',
                 foreignField: '_id',
                 as: 'user'
               }
           },
           {"$unwind": "$user"},
           {
             $project: //For getting appropriate field that you want
              {
              created_date:1,
              my_user_id: "$send_from_user_id",
              friend_user_id: "$user._id",
              cover_picture: "$user.cover_picture",
              profile_pic: "$user.profile_pic",
              profession: "$user.profession",
              education: "$user.education",
              location: "$user.location",
              describeme: "$user.describeme",
              username: "$user.username",
              chatPassword:"$user.chatPassword",
              email: "$user.email",
              mobile: "$user.mobile",
              first_name: "$user.first_name",
              middle_name:"$user.middle_name",
              last_name: "$user.last_name",

               }
           },
         ]).sort({created_date:-1}).exec();
     }
 });


/*****************************End Section Find  AROUND User only public API***************************/



/*****************************Start Section Find  AROUND User ANd friend only public API***************************/
 router.post('/chatUserSearch', async (req, res, next) => {
     let latitude = req.body.latitude;
     let longitude = req.body.longitude;
     let userid = req.body.userid;
     let first_name = req.body.first_name;
     let geofence = req.body.geofence;
	   geofence =  Number(geofence);
     try {
             var friendUser = await getFriendList();
             var aroundUser = await getAroundUser();
             const promises = friendUser.map(removeFriendUserFromAroundUserArray);
             await Promise.all(promises);
		 	       res.json({status: true, friendUserList: friendUser ,aroundUserList: aroundUser,profile: "profileImg"});  
        } 
     catch (e){
             res.json({status: false, msg: 'Unable to get user list.'});
      }
            async function removeFriendUserFromAroundUserArray(fuser){
              aroundUser.forEach(function(auser, index, object) {
                  if(fuser.username==auser.username){
                    object.splice(index, 1);
                 }
              });
            }
 
  function getAroundUser()
                  {
                      return User.aggregate([
                      {
                       
                       $geoNear: {
                            near: { type: "Point", coordinates: [ latitude , longitude ] },
                            distanceField: "dist.calculated",
                            maxDistance: geofence,
                            query: { status: 1 },
                            includeLocs: "dist.latlong",
                            num: 500,
                            spherical: true
                           }
                      },
                      {
                         $match: {first_name : { $regex : first_name } }
                      }, 
                      {
                           $lookup : 
                              {
                                from: 'friends',
                                localField: '_id',
                                foreignField: 'send_to_user_id',
                                as: 'friend'
                              }
                      },
                      {
                        $project: //For getting appropriate field that you want
                          {
                          created_date:1,
                          profile_pic:1,
                          cover_picture:1,
                          profile_pic:1,
                          profession:1,
                          education:1,
                          describeme:1,
                          username:1,
                          mobile:1,
                          chatPassword:1,
                          email:1,
                          first_name:1,
                          middle_name:1,
                          last_name:1,
                          friend: 
                              { 
                                $filter: 
                                { 
                                  input: "$friend", 
                                  as: "friend", 
                                  cond: { $and: [ { $eq: [ "$$friend.request_type", 2 ] },{ $eq: [ "$$friend.send_from_user_id", mongoose.Types.ObjectId(req.body.userid) ] } ] } //check user id in friend_user_id field
                                }
                              },
                          }
                       },

                      ]).sort({created_date:-1})
                        .exec();
                  }
    
 function getFriendList()
    {
     return Friend.aggregate([
           { 
             $match : {send_from_user_id : mongoose.Types.ObjectId(userid) ,status:1,request_type:1}
           },
           {
            $lookup://Join user table with friends table
               {
                 from: 'users',
                 localField: 'send_to_user_id',
                 foreignField: '_id',
                 as: 'user'
               }
           },
          {"$unwind": "$user"},
          {
             $project: //For getting appropriate field that you want
              {
                created_date:1,
                my_user_id: "$send_from_user_id",
                friend_user_id: "$user._id",
                cover_picture: "$user.cover_picture",
                profile_pic: "$user.profile_pic",
                profession: "$user.profession",
                education: "$user.education",
                location: "$user.location",
                describeme: "$user.describeme",
                username: "$user.username",
                chatPassword:"$user.chatPassword",
                email: "$user.email",
                mobile: "$user.mobile",
                first_name: "$user.first_name",
                middle_name:"$user.middle_name",
                last_name: "$user.last_name",
               }
          },
          {
            $match : { "first_name" : { $regex : first_name } }
          },
         ]).sort({created_date:-1}).exec();
     }
 });


/*****************************End Section Find  AROUND User only public API***************************/


module.exports = router;