/*

* * */
let mongoose = require('mongoose');
var beatSchema   = new mongoose.Schema({
    "user_id":{
        type : String,
        required:true
    },
    "reg_no":{
        type : String,
        required:true
    },
    "imei":String,
    "startTime":Date,
    "endTime":Date,
    "beatSSE":{
        type : String,
        required:true
    },
    "beatSection":{
        type : String,
        required:true
    },
    beatStart: {
        "address":String,
        "landmark":String,
        "latitude":Number,
        "longitude":Number,
        "km":Number,
        "meter":Number
    },
    beatEnd: {
        "address":String,
        "landmark":String,
        "latitude":Number,
        "longitude":Number,
        "km":Number,
        "meter":Number
    },

    "created_at":Date,
    "modified_at":Date
});


beatSchema.index({user_id: 1, reg_no: 1}, {unique: true});

module.exports = mongoose.model('beat', beatSchema);