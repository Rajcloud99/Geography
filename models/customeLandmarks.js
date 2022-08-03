/* Created By kamal
18/12/2019
* * */
let mongoose = require('mongoose');
var cLandmarkSchema   = new mongoose.Schema({
    "user_id":{
        type : String,
        required:true
    },
    "name":{
        type : String,
        required:true
    },
    address:{
        type : String,
        required:true
    },
    category:String,
    "location":{
        latitude:Number,
        longitude:Number
    },
    km:Number,
    dist:Number,
    catDet:String,//category details
    "coordinates":[Number],
    "created_at":Date,
    "modified_at":Date
});

cLandmarkSchema.index({user_id: 1, name: 1}, {unique: true});

module.exports = mongoose.model('customlandmarks', cLandmarkSchema);