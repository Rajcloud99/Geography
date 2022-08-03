/**
 * Created by Kamal on 02/16/2018.
 */
let mongoose = require('mongoose');
var postalSchema   = new mongoose.Schema({
    "place_name":String,
    "place_name_s":String,
    "postal_code":String,
    "location":[Number],
    "admin1":String,
    "admin1_s":String,
    "admin2":String,
    "admin2_s":String,
    "admin3":String,
    "admin3_s":String,
    "admin4":String,
    "admin4_s":String,
    "country code":String,
    "country_name":String,
    "accuracy":Number,
    "refined_addr" : {
        type: Boolean,
        default:false
    },
    "formatted_address":String,
    "s":String,
    "modified_at":Date
});

module.exports = mongoose.model('postal', postalSchema);