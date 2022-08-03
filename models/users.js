let mongoose = require('mongoose');

let User = new mongoose.Schema({
        clientId: constant.requiredNumber,
        mobile : constant.requiredNumber,
        email:String,
        sec_mobile:String,
        recovery_email:String,
        password:constant.requiredString,
        name:constant.requiredString,
        email:String,
        createdAt: Date,
        createdBy: String,
        modifiedAt:Date,
        modifiedBy:String
    }
);
User.index({mobile: 1}, {unique: true});
module.exports = mongoose.model('users', User);
