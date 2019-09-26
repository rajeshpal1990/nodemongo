var mongoose = require('mongoose');
var config = require('../config/database');
var router = express.Router();
var multer  = require('multer');
const urlMetadata = require('url-metadata');
var bodyParser = require('body-parser');
var User = require("../models/userModel");
var Post = require("../models/postModel");
var Like = require("../models/likeModel");
var Share = require("../models/shareModel");
var Comment = require("../models/commentModel");
var Friend = require("../models/friendModel");
var UserGallery = require("../models/usergalleryModel");
var path = require('path');
var fs = require('fs');
var root_path = path.resolve();
var root_path = 'http://67.205.173.26:3000';
var profile_pic_path = 'http://67.205.173.26:3000/profileImg/';
var imgName = '';
var galleryImgName = '';
  var storage =   multer.diskStorage({  
         destination: function (req, file, callback) {  
            callback(null,'./uploads/postImg');  
        },  
        filename: function (req, file, callback) {  
          imgName = file.fieldname + '-' + Date.now() + path.extname(file.originalname);
          galleryImgName = imgName;
          callback(null, imgName);
          //example, copy 'imgName' from '/uploads/postImg/' to '/uploads/galleryImg/'
          copyFile('./uploads/postImg/'+imgName, './uploads/galleryImg/');
        }  
      }); 
      var upload = multer({
        storage: storage
     }).single('picture');

      //copy the $file to $dir2
      var copyFile = (file, dir2)=>{
        //include the fs, path modules
        var fs = require('fs');
        var path = require('path');

        //gets file name and adds it to dir2
        var f = path.basename(file);
        var source = fs.createReadStream(file);
        var dest = fs.createWriteStream(path.resolve(dir2, f));

        source.pipe(dest);
        source.on('end', function() { console.log('Succesfully copied'); });
        source.on('error', function(err) { console.log(err); });
      };



/*****************************Start Section Add New Post API***************************/
  router.post('/addPost',upload, function(req, res, next) {
    
         /* Start If there is any url in text from title or post content then get the url and find the meta image from url site*/
                   var url_status = 0;  
                   var text_url = 0;  
                   var geturl = new RegExp(
                            "(^|[ \t\r\n])((ftp|http|https|gopher|mailto|news|nntp|telnet|wais|file|prospero|aim|webcal):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))"
                           ,"g"
                         );
                   var string = req.body.title;
                   var urlList = string.match(geturl);
    console.log(urlList);
     if(urlList){
                   var urlLength = string.match(geturl).length;
                   urlMetadata(urlList[0]).then(
                      function (metadata) { // success handler
                        console.log(metadata.image);
                        if(urlLength>=1){
                           url_status = 1;  
                           text_url = metadata.image;
                        }
                      },
                      function (error) { // failure handler
                       // console.log(error)
                   });
       }
       /* End If there is any url in text or post content from title then get the url and find the meta image from url site*/

        var postDetail;
        var latitute = req.body.latitute;
        var logitute = req.body.logitute;
        let newPost = new Post({
            user_id: req.body.user_id,
            title: req.body.title,
            url_status:url_status,
            text_url:text_url,
            description: req.body.description,
            visibility: req.body.visibility,
            picture: imgName,
            type: req.body.type,
            location : {
                type : 'Point',
                coordinates : [latitute,logitute],
            },
			     file_type:req.body.file_type,
			     latitute: req.body.latitute,
           logitute: req.body.logitute,
           event_start_date: req.body.event_start_date,
           event_end_date: req.body.event_end_date,
			     venue: req.body.venue,
        });
        console.log(newPost);
        var type = req.body.type;
         if(type==1)
          var postVar ="Post";
         if(type==2)
          var postVar ="Feed";
         if(type==3)
          var postVar ="Event";
        newPost.save().then(function(post){
          postDetail = post;
          var userUpdate= {
            latitude: latitute,
            longitude: logitute
          };
          User.update({_id: req.body.user_id},{$set:userUpdate},function( err,user){
               
            });
           return true;
        }).then(function(){
          
          /* Start section below code are used to update same image in to gallery */
                        if(galleryImgName!='')
                        {
                            let newGallery = new UserGallery({
                                 user_id: req.body.user_id,
                                 gallery_picture: galleryImgName,
                                 ispostImg: 1,
                              });
                             newGallery.save(function(err){
                                  if (err)
                                  {
                                   res.json({status: false, msg: 'Failed to create a new '+postVar +'.'});
                                  }
                                  else
                                  {
                                     res.json({status: true, msg: postVar +' has been Created.'});
                                     updateTexturl();
                                  }
                              });
             /* End section below code are used to update same image in to gallery */
                }
              else
                {
                     res.json({status: true, msg: postVar +' has been Created.'});
                     updateTexturl();
                }
          
        }).catch(function(err) {
          res.json({status: false, msg: 'Failed to create a new '+postVar +'.'}); 
         });
    
    
                /*Start section,  This section will update og::image if there exist a URL in title of the Post ,
                it will update the two field from the collection the current post that u created */
                  function updateTexturl(){
                          setTimeout(function () {
                                  var postUpdate= {
                                    url_status:url_status,
                                    text_url:text_url,
                                  };
                                  Post.update({_id: postDetail._id},{$set:postUpdate},function( err,postupdate){

                                    });
                                }, 5000);
                      }    
                 /*End section, */
   
    });

/*****************************Start Section Add New Post API***************************/
  
/*****************************Start Section Find All Post API***************************/
    router.get('/getAllPost', function(req, res, next) {
        Post.find({})
            .populate('user_id')
            .exec(function(err, post) {
                if (err)
                  {
                    res.json({status: false, msg: 'Unable to update a Post.'});
                  }
                else
                  {
                    res.send({status: true,data: post});
                  }
            });
    });

/*****************************Start Section Find  AROUND Post only public API***************************/
  router.post('/getAroundPost', function(req, res, next) {
     let latitude = req.body.latitude;
     let longtide = req.body.longtide;
     let geofence = req.body.geofence;
     console.log(geofence);
     geofence =  Number(geofence);
      if(geofence==0){
        geofence = 50;
      }
	       console.log(req.body);

      Post.aggregate([
       {
         $geoNear: {
                near: { type: "Point", coordinates: [ parseFloat(latitude) , parseFloat(longtide) ] },
                distanceField: "distance",
                includeLocs: "latlong",
                maxDistance: geofence,
                spherical: true
             }
       },
      { $match : { "visibility" : 2 } } ,//public
       {
       $lookup://Join posts table with limit table
           {
             from: 'likes',
             localField: '_id',
             foreignField: 'post_id',
             as: 'likes'
           }
      },
      {
         $lookup://Join post table with commets table
             {
               from: 'comments',
               localField: '_id',
               foreignField: 'post_id',
               as: 'comments'
             },

      },
      {
        $lookup://Join likes table with posts table
           {
             from: 'users',
             localField: 'user_id',
             foreignField: '_id',
             as: 'user'
           }
      },
     {"$unwind": "$user"}, 
     {
        $project: //For getting appropriate field that you want
          {
          status:1,
          title:1,
          user_id:1,
          description:1,
          picture:1,
          distance:1,
          latitute:1,
          logitute:1,
          created_date:1,
          updated_date:1,
          file_type:1,
          type:1,
          event_start_date:1,
          event_end_date:1,
          venue:1,
          visibility:1,
          latlong:1,
          profile_pic: "$user.profile_pic",
          username: "$user.username",
          email: "$user.email",
          first_name: "$user.first_name",
		       middle_name:"$user.middle_name",
          last_name: "$user.last_name",
          numberOfLike: { $size: "$likes" },
          numberOfComment: { $size: "$comments" },
          likes: 
            { 
              $filter: 
              { 
                input: "$likes", 
                as: "like", 
                cond: { $and: [ { $eq: [ "$$like.status", 1 ] },{ $eq: [ "$$like.user_id", mongoose.Types.ObjectId(req.body.userid) ] } ] } //check user id in friend_user_id field
              }
            },
       
          comments: { $slice: ["$comments", -1]  } // it will return last item from comment array

          }
      },
      
        
    ]).sort({created_date:-1})
        .exec(function(err, post) {
                  if (err)
                    {
                      res.json({status: false, msg: 'No record found.'});
                    }
                  else
                    {
                      res.send({status: true,data: post,path: 'http://67.205.173.26:3000/profileImg/',profile: "profileImg"});
                    }
              });
    });
/*****************************End Section Find  AROUND Post only public API***************************/


/*****************************Start Section Find All Friend Post Either public or Private API***************************/
 router.get('/getFriendPost1/:userid', function(req, res, next) {
     Friend.aggregate([
      { 
        $match : { "send_from_user_id" : mongoose.Types.ObjectId(req.params.userid)}
      } ,
      {
       $lookup://Join friends table with posts table
           {
             from: 'posts',
             localField: 'send_to_user_id',
             foreignField: 'user_id',
             as: 'post'
           }
      },
      {
           $lookup : 
              {
                from: 'users',
                localField: 'post.user_id',
                foreignField: '_id',
                as: 'user'
              }
      },
      {
            $unwind: "$post"
      },
      {
            $unwind: "$user"
      },
      {
           $lookup : 
              {
                from: 'comments',
                localField: 'post._id',
                foreignField: 'post_id',
                as: 'comment'
              }
      },
      {
           $lookup : 
              {
                from: 'likes',
                localField: 'post._id',
                foreignField: 'post_id',
                as: 'like'
              }
      },
    
      {
        $project: //For getting appropriate field that you want
          {
         
          _id: 0,
          _id: "$post._id",
          title: "$post.title",
          status: "$post.status",
          user_id: "$post.user_id",
          description: "$post.description",
          picture: "$post.picture",
          distance: "$post.distance",
          latitute: "$post.latitute",
          logitute: "$post.logitute",
          created_date: "$post.created_date",
          updated_date: "$post.updated_date",
          file_type: "$post.file_type",
          event_start_date: "$post.event_start_date",
          event_end_date: "$post.event_end_date",
          venue: "$post.venue",
          visibility: "$post.visibility",
          profile_pic: "$user.profile_pic",
          username: "$user.username",
          email: "$user.email",
          first_name: "$user.first_name",
		      middle_name:"$user.middle_name",
          last_name: "$user.last_name",
          numberOfLike: { $size: "$like" },
          numberOfComment: { $size: "$comment" },
          likes: 
            { 
              $filter: 
              { 
                input: "$like", 
                as: "like", 
                cond: { $and: [ { $eq: [ "$$like.status", 1 ] },{ $eq: [ "$$like.user_id", mongoose.Types.ObjectId(req.params.userid) ] } ] } //check user id in friend_user_id field
              }
            },
         /*users : 
            { 
              $filter: 
              { 
                input: "$user", 
                as: "user", 
                cond: { $and: [ { $eq: [ "$$user.status", 1 ] }] } //check user id in friend_user_id field
              }
          },
         comments: 
            { 
              $filter: 
              { 
                input: "$comment", 
                as: "comment", 
                cond: { $and: [ { $eq: [ "$$comment.status",1 ] } ] } //check user id in friend_user_id field
              } 
            },*/
            comments: { $slice: ["$comment", -1]  } // it will return last item from comment array

          }
      }, 
     
     
      ]).sort({created_date:-1})
        .exec(function(err, post) {
                  if (err)
                    {
                      res.json({status: false, msg: 'No record found.'});
                    }
                  else
                    {
                      res.send({status: true,data: post,path: 'http://67.205.173.26:3000/profileImg/',profile: "profileImg"});
                    }
              });
    });


router.get('/getFriendPost/:userid', function(req, res, next) {
     Friend.aggregate([
      { 
        $match : { "status":1,"request_type":1,"send_from_user_id" : mongoose.Types.ObjectId(req.params.userid)}
      } ,
      {
       $lookup://Join friends table with posts table
           {
             from: 'posts',
             localField: 'send_to_user_id',
             foreignField: 'user_id',
             as: 'post'
           }
      },
        {
           $lookup : 
              {
                from: 'users',
                localField: 'send_to_user_id',
                foreignField: '_id',
                as: 'user'
              }
      },
      {
            $unwind: "$post"
      },
      {
            $unwind: "$user"
      },

      // var user_pic = profile_pic_path + "$user.profile_pic";

      {
           $lookup : 
              {
                from: 'comments',
                localField: 'post._id',
                foreignField: 'post_id',
                as: 'comment'
              }
      },
      {
           $lookup : 
              {
                from: 'likes',
                localField: 'post._id',
                foreignField: 'post_id',
                as: 'like'
              }
      },
      
     {
        $project: //For getting appropriate field that you want
          {      
          _id: 0,
          _id: "$post._id",
          title: "$post.title",
          status: "$post.status",
          user_id: "$post.user_id",
          description: "$post.description",
          picture: "$post.picture",
          distance: "$post.distance",
          latitute: "$post.latitute",
          logitute: "$post.logitute",
          created_date: "$post.created_date",
          updated_date: "$post.updated_date",
          file_type: "$post.file_type",
          event_start_date: "$post.event_start_date",
          event_end_date: "$post.event_end_date",
          venue: "$post.venue",
          visibility: "$post.visibility",
          profile_pic: "$user.profile_pic",
          username: "$user.username",
          email: "$user.email",
          first_name: "$user.first_name",
		      middle_name:"$user.middle_name",
          last_name: "$user.last_name",
          numberOfLike: { $size: "$like" },
          numberOfComment: { $size: "$comment" },
          likes: 
            { 
              $filter: 
              {
                input: "$like", 
                as: "like", 
                cond: { $and: [ { $eq: [ "$$like.status", 1 ] },{ $eq: [ "$$like.user_id", mongoose.Types.ObjectId(req.params.userid) ] } ] } //check user id in friend_user_id field
              }
            },
         /*users : 
            { 
              $filter: 
              { 
                input: "$user", 
                as: "user", 
                cond: { $and: [ { $eq: [ "$$user.status", 1 ] }] } //check user id in friend_user_id field
              }
          },
         comments: 
            { 
              $filter: 
              { 
                input: "$comment", 
                as: "comment", 
                cond: { $and: [ { $eq: [ "$$comment.status",1 ] } ] } //check user id in friend_user_id field
              } 
            },*/
            comments: { $slice: ["$comment", -1]  } // it will return last item from comment array

          }
      }, 
      {
         $match: {      
                 $or:[{"visibility" : 2 }, { "visibility" : 1 }]
               }
      },
        
      
     
      ]).sort({created_date:-1})
        .exec(function(err, post) {
                  if (err)
                    {
                      res.json({status: false, msg: 'No record found.'});
                    }
                  else
                    {
                      res.send({status: true,data: post,path: 'http://67.205.173.26:3000/profileImg/',profile: "profileImg"});
                    }
              });
    });
/*****************************End Section Find All Friend Post Either public or Private API***************************/




/*****************************End Section Find All Public Post No Matter Latitude or longitude API***************************/
  router.get('/getPublicPost/:userid', function(req, res, next) {
      Post.aggregate([
      
      { $match : { "visibility" : 2} } ,
       {
       $lookup://Join posts table with limit table
           {
             from: 'likes',
             localField: '_id',
             foreignField: 'post_id',
             as: 'likes'
           }
      },
      {
         $lookup://Join post table with commets table
             {
               from: 'comments',
               localField: '_id',
               foreignField: 'post_id',
               as: 'comments'
             },

      },
      {
        $lookup://Join likes table with posts table
           {
             from: 'users',
             localField: 'user_id',
             foreignField: '_id',
             as: 'user'
           }
      },
     {"$unwind": "$user"}, 
     {
        $project: //For getting appropriate field that you want
          {
          status:1,
          title:1,
          user_id:1,
          description:1,
          picture:1,
          distance:1,
          latitute:1,
          logitute:1,
          created_date:1,
          updated_date:1,
          file_type:1,
          type:1,
          event_start_date:1,
          event_end_date:1,
          venue:1,
          visibility:1,
          profile_pic: "$user.profile_pic",
          username: "$user.username",
          email: "$user.email",
          first_name: "$user.first_name",
		      middle_name:"$user.middle_name",
          last_name: "$user.last_name",
          numberOfLike: { $size: "$likes" },
          numberOfComment: { $size: "$comments" },
          numberOfLike: { $size: "$likes" },
          numberOfComment: { $size: "$comments" },
          likes: 
            { 
              $filter: 
              { 
                input: "$likes", 
                as: "like", 
                cond: { $and: [ { $eq: [ "$$like.status", 1 ] },{ $eq: [ "$$like.user_id", mongoose.Types.ObjectId(req.params.userid) ] } ] } //check user id in friend_user_id field
              }
            },
          /* comments: 
            { 
              $filter: 
              { 
                input: "$comments", 
                as: "comment", 
                cond: { $and: [ { $eq: [ "$$comment.status",1 ] } ] } //check user id in friend_user_id field
              } 
            },*/
           comment: { $slice: ["$comments", 2]  } 

          }
      },
     
        
    ]).sort({created_date:-1})
        .exec(function(err, post) {
                  if (err)
                    {
                      res.json({status: false, msg: 'No record found.'});
                    }
                  else
                    {
                      res.send({status: true,data: post,path: 'http://67.205.173.26:3000/profileImg/'});
                    }
              });
    });
/*****************************End Section Find All Public Post No Matter Latitude or longitude API***************************/


/*************Start Section Find All Post API Acoording to UserId*****************/
   router.get('/getUserPost/:userid', function(req, res, next) {
      Post.aggregate([
       { 
         $match : { user_id : mongoose.Types.ObjectId(req.params.userid) }
       } ,
         {
       $lookup://Join posts table with limit table
           {
             from: 'likes',
             localField: '_id',
             foreignField: 'post_id',
             as: 'likes'
           }
      },
      {
         $lookup://Join post table with commets table
             {
               from: 'comments',
               localField: '_id',
               foreignField: 'post_id',
               as: 'comments'
             },

      },
	 {
        $lookup://Join likes table with posts table
           {
             from: 'users',
             localField: 'user_id',
             foreignField: '_id',
             as: 'user'
           }
      },
     {"$unwind": "$user"},
        
     {
        $project: //For getting appropriate field that you want
          {
          status:1,
          title:1,
          user_id:1,
          description:1,
          picture:1,
          distance:1,
          latitute:1,
          logitute:1,
          created_date:1,
          updated_date:1,
          file_type:1,
          type:1,
          event_start_date:1,
          event_end_date:1,
          venue:1,
          visibility:1,
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
          numberOfLike: { $size: "$likes" },
          numberOfComment: { $size: "$comments" },
           likes: 
            { 
              $filter: 
              { 
                input: "$likes", 
                as: "like", 
                cond: { $and: [ { $eq: [ "$$like.status", 1 ] },{ $eq: [ "$$like.user_id", mongoose.Types.ObjectId(req.params.userid) ] } ] } //check user id in friend_user_id field
              }
            },
         /*  comments: 
            { 
              $filter: 
              { 
                input: "$comments", 
                as: "comment", 
                cond: { $and: [ { $eq: [ "$$comment.status",1 ] } ] } //check user id in friend_user_id field
              } 
            },*/
          comment: { $slice: ["$comments", -1]  } 

          }
      },
     
        
    ]).sort({created_date:-1})
        .exec(function(err, post) {
          
                 if (err)
                  {
                    res.json({status: false, msg: 'Unable to update a Post.'});
                  }
                else
                  {
                    
                    
                    res.send({status: true,data: post,path: 'http://67.205.173.26:3000/profileImg/',profile:'profilePic'});
                  }
       
              });
    });




/*************Start Section Find All Post API Acoording to UserId not Mine User It's other User*****************/
   router.get('/getOtherUserPost/:userid/:profileId', function(req, res, next) {
    var status_friend = 0;
    Friend.aggregate([
      { 
        $match : { send_from_user_id : mongoose.Types.ObjectId(req.params.profileId),send_to_user_id : mongoose.Types.ObjectId(req.params.userid),request_type:1}
      },
      {
        $project : {
          created_date:1,
          send_from_user_id: 1,
          status: 1,
          send_to_user_id: 1,
          _id: 0
          }
      }
    ]).exec(function(err,friend){
   
    User.aggregate([
      {
        $match : { _id : mongoose.Types.ObjectId(req.params.userid) }
      },
      {
      $project : {
        first_name : 1,
        last_name : 1,
        cover_picture : 1,
        profile_pic : 1,
        education : 1,
        location : 1,
        profession : 1      
      }
    }
    ]).exec(function(error,user){
      
      Post.aggregate([
       { 
         $match : { user_id : mongoose.Types.ObjectId(req.params.userid) }
       } ,
         {
       $lookup://Join posts table with limit table
           {
             from: 'likes',
             localField: '_id',
             foreignField: 'post_id',
             as: 'likes'
           }
      },
      {
         $lookup://Join post table with commets table
             {
               from: 'comments',
               localField: '_id',
               foreignField: 'post_id',
               as: 'comments'
             },

      },
	 {
        $lookup://Join likes table with posts table
           {
             from: 'users',
             localField: 'user_id',
             foreignField: '_id',
             as: 'user'
           }
      },
     {"$unwind": "$user"},
        
     {
        $project: //For getting appropriate field that you want
          {
          status:1,
          title:1,
          user_id:1,
          description:1,
          picture:1,
          distance:1,
          latitute:1,
          logitute:1,
          created_date:1,
          updated_date:1,
          file_type:1,
          type:1,
          event_start_date:1,
          event_end_date:1,
          venue:1,
          visibility:1,
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
          numberOfLike: { $size: "$likes" },
          numberOfComment: { $size: "$comments" },
           likes: 
            { 
              $filter: 
              { 
                input: "$likes", 
                as: "like", 
                cond: { $and: [ { $eq: [ "$$like.status", 1 ] },{ $eq: [ "$$like.user_id", mongoose.Types.ObjectId(req.params.userid) ] } ] } //check user id in friend_user_id field
              }
            },
         /*  comments: 
            { 
              $filter: 
              { 
                input: "$comments", 
                as: "comment", 
                cond: { $and: [ { $eq: [ "$$comment.status",1 ] } ] } //check user id in friend_user_id field
              } 
            },*/
          comment: { $slice: ["$comments", -1]  } 

          }
      },
      {
        $match: 
            {      
                 $or:[{"visibility" : 2 }]
            }
      },
     
        
    ]).sort({created_date:-1})
        .exec(function(err, post) {
          
                 if (err)
                  {
                    res.json({status: false, msg: 'Unable to update a Post.'});
                  }
                else
                  { 
                    console.log(friend);
                    if(friend.length < 1){
                      status_friend = '3';
                    }else{
                      status_friend = friend[0].status;
                    }               
                    res.send({status: true, user_data: user,friend_status:status_friend, data: post, path: 'http://67.205.173.26:3000/profileImg/',profile:'profileImg',cover_path:'http://67.205.173.26:3000/galleryImg/'});
                  }
       
              });
            });
         });   
    });
/*****************************Start Section Delete Post API***************************/
    router.get('/deletePost/:id', function(req, res, next) {
        Post.findByIdAndRemove(req.params.id,function(err,post){
                if (err)
                  {
                    res.json({status: false, msg: 'Unable to delete a Post.'});
                  }
                else
                  { 
                    fs.unlink('./uploads/postImg/'+post.picture, function() {
                      res.send({status: true, msg: 'Post has been Deleted.'});
                    });
                  }
          });
      });


/*******************start Section Hide Post***************************************/
router.post('/hidePost', function(req, res, next) {
    var updateData = { visibility: req.body.visibility }
    Post.findByIdAndUpdate({_id: req.body.postid},updateData, function (err, user) {
      if (err){
          res.json({status: false, msg: 'Unable to hide your post.'});
          }
        else
          {
            res.json({status: true, data: "Your post has been successfully hide."});
          }
    });
});

/*****************************Start Section View Post Detail API***************************/

    router.get('/postDetail/:id', function(req, res, next) {
        Post.findOne({_id:req.params.id},function( err,post){
                if (err)
                  {
                    res.json({status: false, msg: 'Unable to get a Post.'});
                  }
                else
                  { 
                    res.send({status: true, data: post,path:"http://67.205.173.26:3000/profileImg/"});
                  }
          });
      });

/*****************************Start Section Update Post API***************************/
    router.post('/updatePost/:id',upload, function(req, res, next) {
      console.log(req.body);
        var latitute = req.body.latitute;
        var logitute = req.body.logitute;
        let newPost = new Post({
            user_id: req.body.user_id,
            title: req.body.title,
            description: req.body.description,
            visibility: req.body.visibility,
            picture: imgName,
            type: req.body.type,
            location : {
                type : 'Point',
                coordinates : [latitute,logitute],
            },
			     file_type:req.body.file_type,
			     latitute: req.body.latitute,
           logitute: req.body.logitute,
           event_start_date: req.body.event_start_date,
           event_end_date: req.body.event_end_date,
			     venue: req.body.venue,
        });
      console.log(newPost);
      console.log(req.params.id);
      Post.findByIdAndUpdate(req.params.id,{$set:newPost},function( err,post){
              if (err)
                {
                  res.json({status: false, msg: 'Unable to update a Post.'});
                }
             else
                { 
                  if(req.file){
                       fs.unlink('.uploads/postImg/'+post.picture, function() {
                         });
                    }
                    res.send({status: true, msg: 'Post has been Updated.'});

                }
            });
    });



  /*****************************Start Section Like Post API***************************/
  router.post('/likePost', function(req, res, next) {
  Like.findOne({$and: [{user_id: req.body.user_id},{post_id: req.body.post_id}]}).exec(function(err, like){
                if (like) 
                      { 
                           // const updateData = { status: req.body.status }
                            Like.findByIdAndRemove({_id: like.id},function(err, like) {
                                if (err)
                                    {
                                      res.json({status: false, msg: 'Unable to perform operation'});
                                    }
                                else
                                    { 
                                      res.send({status: true, msg: 'Post has been Unlike successfully.'});
                                    }
                                });
                       
                      }
                 else {

                            let newLike = new Like({
                                  user_id: req.body.user_id,
                                  post_id: req.body.post_id,
                                  status: req.body.status
                                  //status: req.body.status
                                });
                              console.log(newLike);
                              newLike.save(function(err){
                              if (err)
                                {
                                  res.json({status: false, msg: 'Failed to Like Post.'});
                                }
                                else
                                {
                                  res.send({status: true, msg: 'Post has been like successfully.'});
                                }
                            });
                      }
        });//Execute methode close here
});


  /*****************************Start Section Like Post API***************************/
  router.post('/likePost1', function(req, res, next) {
  Like.findOne({$and: [{user_id: req.body.user_id},{post_id: req.body.post_id}]}).exec(function(err, like){
                if (like) 
                      { 
                            const updateData = { status: req.body.status }
                            Like.findByIdAndUpdate({_id: like.id}, updateData, function(err, like) {
                                if (err)
                                    {
                                      res.json({status: false, msg: 'Unable to perform operation'});
                                    }
                                else
                                    { if(req.body.status==0)
                                      res.send({status: true, msg: 'Post has been Unlike successfully.'});
                                      else
                                      res.send({status: true, msg: 'Post has been Like successfully.'});
                                    }
                                });
                       
                      }
                else  {

                          let newLike = new Like({
                                user_id: req.body.user_id,
                                post_id: req.body.post_id,
                                status: req.body.status
                              });
                  console.log(newLike);
                            newLike.save(function(err){
                            if (err)
                              {
                                res.json({status: false, msg: 'Failed to Like Post.'});
                              }
                              else
                              {
                                res.send({status: true, msg: 'Post has been like successfully.'});
                              }
                          });
                      }
        });//Execute methode close here
});


/*****************************Start Section Share Post API***************************/
  router.post('/sharePost', function(req, res, next) {
        let newShare = new Share({
            user_id: req.body.user_id,
            post_id: req.body.post_id,
            status: req.body.status
        });
        newShare.save(function(err){
            if (err)
              {
                res.json({status: false, msg: 'Failed to Share Post.'});
              }
              else
              {
                res.send({status: true, msg: 'Post has been share successfully.'});
              }
        });
});

  /*****************************Start Section Comment Post API***************************/
  router.post('/commentPost', function(req, res, next) {
    let newComment = new Comment({
        user_id: req.body.user_id,
        post_id: req.body.post_id,
        comment_text: req.body.comment_text
    });
    newComment.save(function(err){
        if (err)
          {
            res.json({status: false, msg: 'Failed to comment Post.'});
          }
          else
          {
            res.send({status: true, msg: 'Post has been commented successfully.'});
          }
    });
});
/*****************************End Section Comment Post API***************************/


/*****************************Start Section Delete Comment API***************************/
router.get('/deleteComment/:id',function(req,res,next){
     Comment.findByIdAndRemove(req.params.id,function(err,comment){
       if(err)
         res.json({status:false,msg:'Unable to delete a comment.'});
       else
         res.json({status:true,msg: 'Your comment has been deleted successfully.'});
     });
   });   
/*****************************End Section Delete Comment API***************************/


/*****************************Start Section Display All comment from post_id API***************************/
router.get('/allCommentOfPost/:postid',(req,res,next)=>{
       Post.aggregate([
         {
            $match : {_id : mongoose.Types.ObjectId(req.params.postid)}
         },
         {
           $lookup : 
              {
                from: 'comments',
                localField: '_id',
                foreignField: 'post_id',
                as: 'comment'
              }
         },
         {
            $unwind: "$comment"
         },
         {
            $lookup: {
                from: "users",
                localField: "comment.user_id",
                foreignField: "_id",
                as: "comment.user"
            }
         },
		 {
            $unwind: "$comment.user"
         },
         {
            $project: //For getting appropriate field that you want
              { 
				_id:1,
				title:1,
                comment_id:"$comment._id",
                status:"$comment.status",
                created_date:"$comment.created_date",
                user_id:"$comment.user_id",
                post_id:"$comment.post_id",
                comment_text:"$comment.comment_text",
                username:"$comment.user.username",
                email:"$comment.user.email",
                profile_pic:"$comment.user.profile_pic",
                first_name:"$comment.user.first_name",
                middle_name:"$comment.user.middle_name",
                last_name:"$comment.user.last_name",
                //email:"$comment.user",
               }
         },
         
         
    ]).exec(function(err, post) {
                  if (err)
                    {
                      res.json({status: false, msg: 'No record found.'});
                    }
                  else
                    {
                      res.send({status: true,data: post,profile: 'profileImg',path: 'http://67.205.173.26:3000/profileImg/'});
                    }
    });
 
});  
/*****************************End Section Display All comment from post_id API***************************/

module.exports = router;
