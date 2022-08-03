let mongoose = require('mongoose');

var misSchema = new mongoose.Schema({
        "clientId": String,
        "company" : String,
        "type" : {
            type: String,
            enum: ['Alert','Report']
        },
        "reportName" : String,
        "user": [{
            "_id": {
                "type": mongoose.Schema.Types.ObjectId,
                "ref": "User"
            },
            "name": String,
            "emailId" : String,
            "phoneNo" : Number
        }],
        "serviceType" : {
            type: String,
            enum: ['Email','SMS']
        },
        "reportAs":{
            type: String,
            enum: ['Daily', 'Weekly', 'Monthly']
        },

    }
);

misSchema.index({reportName: 1, clientId: 1}, {unique: true});

module.exports = mongoose.model('mis', misSchema);