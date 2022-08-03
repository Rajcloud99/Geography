/**
 * Created by Kamal on 02/16/2018.
 */
let mongoose = require('mongoose');
var landmarkSchema   = new mongoose.Schema({
    "geonameid":String,
    "asciiname":String,
    "name":String,
    "location":[Number],
    "feature_class":String,
    "feature_code":String,
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
    "refined_addr" : {
        type: Boolean,
        default:false
    },
    "formatted_address":String,
    "modified_at":Date
});

module.exports = mongoose.model('landmarks', landmarkSchema);