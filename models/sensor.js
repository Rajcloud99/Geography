
let mongoose = require('mongoose');
var sensorSchema   = new mongoose.Schema({
    s_id:{
        type : String,
        required:true
    },
    category:{
        type:String,
        enum:['Fuel','Temperature','Pressure'],
        required:true
    },
    ver:String,
    company:String,
    device:Number,
    out_unit:String,
    conversion_fact:Number,
    capacity:Number,
    fill_diff:Number,
    drain_diff:Number,
    calib:[{
        lvl:Number,
        val:Number
    }],
    sens_fl:Number,
    user_id:String,
    created_at:Date,
    modified_at:Date
});

sensorSchema.index({s_id:1}, {unique: true});

module.exports = mongoose.model('sensors', sensorSchema);
