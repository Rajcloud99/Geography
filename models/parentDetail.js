/**
 * Created by Kamal on 29/02/2020.
 */
let mongoose = require('mongoose');
var Parent = new mongoose.Schema({
    student:String,
    rfid:Number,
    parent1:{
        relation:String,
        mobile:Number,
        email:String,
    },
    parent2:{
        relation:String,
        mobile:Number,
        email:String,
    },
    datetime: Date,
    user_id: String,
});

module.exports = mongoose.model('parentdetails', Parent);
