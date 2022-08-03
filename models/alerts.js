/**
 * Created by Kamal on 29/02/2020.
 */
let mongoose = require('mongoose');
var alertSchema = new mongoose.Schema({
    imei: Number,
    rfid: Number,
    reg_no: String,
    datetime: Date,
    code: String,
    driver: String,
    extra: String,
    duration: Number,
    location: {
        lng: Number,
        course: Number,
        lat: Number,
        speed: Number,
        address: String
    },
    user_id: String,
    actions: [{
        time: Date,
        action: String
    }]
});

module.exports = mongoose.model('alerts', alertSchema);
