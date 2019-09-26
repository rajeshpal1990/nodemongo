var config = require('../config/database');
var router = express.Router();
var multer  = require('multer');
var bodyParser = require('body-parser');
var Setting = require("../models/settingModel");
var path = require('path');
var fs = require('fs');

/*****************************Start Section Get Setting API***************************/


  router.get('/getSetting', function(req, res, next) {
        Setting.find({})
            .exec(function(err, setting) {
                if (err)
                  {
                    res.json({status: false, msg: 'Unable to Get setting.'});
                  }
                else
                  {
                    res.send({status: true,data: setting});
                  }
            });
    });

/*****************************Start Section Add New Setting API***************************/
    router.post('/addSetting', function(req, res, next) {
        console.log(req.body);
        let newSetting = new Setting({
            title: req.body.title,
            meta_title: req.body.meta_title,
            meta_description: req.body.meta_description,
            meta_keyword: req.body.meta_keyword,
        });
        newSetting.save(function(err){
            if (err)
              {
                res.json({status: false, msg: 'Failed to create a new Setting.'});
              }
              else
              {
                res.json({status: true, msg: 'Setting has been Created.'});
              }
        });
    });


 /*****************************Start Section Update Setting API***************************/
    router.post('/editSetting/:id', function(req, res, next) {
        var editSetting= {
            title: req.body.title,
            meta_title: req.body.meta_title,
            meta_description: req.body.meta_description,
            meta_keyword: req.body.meta_keyword,
            distance: req.body.distance,
      };
        Setting.findByIdAndUpdate(req.params.id,{$set:editSetting},function( err,setting){
                if (err)
                  {
                    res.json({status: false, msg: 'Unable to update a setting.'});
                  }
               else
                  { 
                   
                   res.send({status: true, msg: 'Setting has been Updated.'});
  
                  }
              });
      });

module.exports = router;

