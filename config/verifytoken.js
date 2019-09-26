var jwt = require('jsonwebtoken');
var config = require('../config/database');
module.exports = function(req,res,next) {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (token) {
        console.log(token);
        console.log(config.secret);
        
    // verifies secret and checks exp
        jwt.verify(token,config.secret,function(err, decoded) {
            if (err) { //failed verification.
                return res.json({"error": "Invalid Token"});
            }
            req.decoded = decoded;
            next(); //no error, proceed
        });
    } else {
        // forbidden without token
        return res.status(403).send({
            "error": "Invalid Token"
        });
    }
}