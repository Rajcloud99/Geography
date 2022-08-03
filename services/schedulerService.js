const CronJob = require('cron').CronJob;
const fetchAddress = require("../scripts/fetchAddress");

//'*/2 * * * *'
module.exports = function() {
    var jobDaily = new CronJob({
        cronTime: '*/10 * * * *',
        onTick: postalAddressUpdate,
        start: false,
        timeZone: 'Asia/Kolkata'
    });

}//}();
function cb(err,resp){
    console.log(err);
}
function postalAddressUpdate (){
    var oSettingsPostal = {
        filters : {refined_addr:false},
        projection:{
            place_name:1,
            location:1
        },
        limit:30
    }
    fetchAddress.handlePostals(oSettingsPostal,cb);
};

