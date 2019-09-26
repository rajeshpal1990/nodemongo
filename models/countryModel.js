var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CountrySchema = new Schema({
   country_code:{
      type: String,
      required: true
   },
   country_name:{
      type: String,
      required: true
   },  
}
//,{
   // versionKey: false // You should be aware of the outcome after set to false Or
   // this value increment when u update particular document eg:v: 0 in document
//}
);
module.exports = mongoose.model('Country',CountrySchema);
//module.exports = mongoose.model('Country',CountrySchema,'coutries');
//third parameter is collection name that you want