/**
 * @Author: kamal
 * @Date:   2018-02-27T15:33:38+05:30
 */

const request = require('request');
const async = require('async');

exports.getAddressAsync = (lat, lng) => {
    return new Promise((resolve, reject) => {
        exports.getAddressFromAWS(lat, lng, (err, res) => {
        if(err) return reject(err);
    resolve(res);
});
});
};

exports.getAddress = function(lat, lng, callback) {
    if(process.env.NODE_ENV === 'servertest') return callback(null, null);
    // var url = "http://52.220.18.209/reverse?format=json&lat=" + lat + "&lon=" + lng + "&zoom=18&addressdetails=0";
    const url = "https://maps.googleapis.com/maps/api/geocode/json?latlng="+lat+","+lng+"&key=AIzaSyBE4mbCTpBNN4ynHx3tzAP5wJgz_lN3pXA";
    //const url = "https://maps.googleapis.com/maps/api/geocode/json?latlng="+lat+","+lng;

    request(url, {
        timeout: 5000
    }, function(error, response, body) {
        if (error) {
            // winston.info(error);
            return exports.getAddressFromMapMyIndia(lat, lng, callback);
            //return exports.getAddressFromAWS(lat, lng, callback);
        }
        body = JSON.parse(body);
        if(!body || !body.results || !body.results[0]){
            // telegramBotService.sendMessage('google server limit exceeded');
            return exports.getAddressFromMapMyIndia(lat, lng, callback);
            //return exports.getAddressFromAWS(lat, lng, callback);
        }
        // callback(error, body.display_name);
        // winston.info(JSON.stringify(body.display_name));
        callback(error, body.results[0].formatted_address);
    });
};

exports.getAddressFromAWSAsync = (lat, lng) => {
    return new Promise((resolve, reject) => {
        exports.getAddressFromAWS(lat, lng, (err, res) => {
        if(err) return reject(err);
    resolve(res);
});
});
};

exports.getAddressFromAWS  = function (lat, lng, callback) {
    if(process.env.NODE_ENV === 'servertest') return callback(null, null);
    const url = "http://52.220.18.209/reverse?format=json&lat=" + lat + "&lon=" + lng + "&zoom=18&addressdetails=0";
    //const url = "http://13.229.178.235:4242/reverse?lat=" + lat + "&lon=" + lng;
    request(url, {
        timeout: 5000
    }, function(error, response, body) {
        if (error) {
            //winston.error(error);
            return callback(error);
        }
        try {
            body = JSON.parse(body);
            //winston.info(body.display_name);
            callback(error, body.display_name);
        } catch(err) {
            callback(err);
        }


    });
};
exports.getAddressFromMapMyIndia  = function (lat, lng, callback) {
    if(process.env.NODE_ENV === 'servertest') return callback(null, null);
    const lic_key ="vc795p286g3jn764zca481cd27m28hz3";
    const url = "http://apis.mapmyindia.com/advancedmaps/v1/"+lic_key+"/rev_geocode?lat="+lat+"&lng="+lng;
    request(url, {
        timeout: 5000
    }, function(error, response, body) {
        if (error) {
            //winston.error(error);
            //return callback(error);
            return exports.getAddressFromAWS(lat, lng, callback);
        }
        try {
            body = JSON.parse(body);
            if(body && body.results && body.results[0]){
                return callback(error, body.results[0].formatted_address);
            }else{
                return exports.getAddressFromAWS(lat, lng, callback);
                //callback("fetch another",false);
            }
        } catch(err) {
            callback(err);
        }


    });
};
function cbTest(err,resp){
    console.log(err,resp);
}
//exports.getAddressFromMapMyIndia(23.912817,76.907038,cbTest);
//exports.getAddress(23.912817,76.907038,cbTest);
//exports.getAddressFromAWS(23.912817,76.907038,cbTest);