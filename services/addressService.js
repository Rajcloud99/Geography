/**
 * @Author: kamal
 * @Date:   2018-02-16T11:33:38+05:30
 */

const request = require('request');

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
    //var key = 'AIzaSyBE4mbCTpBNN4ynHx3tzAP5wJgz_lN3pXA';
    var key = 'AIzaSyDUvB8J9i46grF7d0v-g-bBwJIBKGh1uY4';
    //var key = 'AIzaSyBChFjQasM84lL7A_3JvdtdBtZqbe3tQfY';
    //var key = 'AIzaSyAJfAVe_QUH5fYJPR3eyhW4tj67aeLKYAw';//https://www.gps-coordinates.org/
    //var key = 'AIzaSyDvqC-Jo9H1GN6M-VQaDGTc6lUT0Q8rT00';
    //var key = 'AIzaSyALrSTy6NpqdhIOUs3IQMfvjh71td2suzY'//www.latlong.net
    const url = "https://maps.googleapis.com/maps/api/geocode/json?latlng="+lat+","+lng+"&key="+key;
    //const url = "https://maps.googleapis.com/maps/api/geocode/json?latlng="+lat+","+lng;

    request(url, {
        timeout: 5000
    }, function(error, response, body) {
        if (error) {
            return exports.getAddressFromMapMyIndia(lat, lng, callback);
        }
        body = JSON.parse(body);
        if(!body || !body.results || !body.results[0]){
            return exports.getAddressFromMapMyIndia(lat, lng, callback);
        }
        var oResult = {addressServer:'G',formatted_address:body.results[0].formatted_address,address_components:body.results[0].address_components};
        callback(error, oResult);
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
exports.getAddressFromAWSOld  = function (lat, lng, callback) {
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
            var oResult = { addressServer:'N',formatted_address:body.display_name };
            callback(error, oResult);
        } catch(err) {
            callback(err);
        }


    });
};

exports.getAddressGlobal = function(lat, lng, callback) {
    if(process.env.NODE_ENV === 'servertest') return callback(null, null);
    // var url = "http://52.220.18.209/reverse?format=json&lat=" + lat + "&lon=" + lng + "&zoom=18&addressdetails=0";
    //var key = 'AIzaSyBE4mbCTpBNN4ynHx3tzAP5wJgz_lN3pXA';
    //var key = 'AIzaSyDUvB8J9i46grF7d0v-g-bBwJIBKGh1uY4';
    //var key = 'AIzaSyBChFjQasM84lL7A_3JvdtdBtZqbe3tQfY';
    //var key = 'AIzaSyAJfAVe_QUH5fYJPR3eyhW4tj67aeLKYAw';//https://www.gps-coordinates.org/
    //var key = 'AIzaSyDvqC-Jo9H1GN6M-VQaDGTc6lUT0Q8rT00';
    //var key = 'AIzaSyALrSTy6NpqdhIOUs3IQMfvjh71td2suzY'//www.latlong.net
    var key = 'AIzaSyDiX4ZJfCd0pSfRk5UicAGRXfdwf1HF47w';
    const url = "https://maps.googleapis.com/maps/api/geocode/json?latlng="+lat+","+lng+"&key="+key;
    //const url = "https://maps.googleapis.com/maps/api/geocode/json?latlng="+lat+","+lng;

    request(url, {
        timeout: 5000
    }, function(error, response, body) {
        if (error) {
            return exports.getAddressFromAWSOld(lat, lng, callback);
        }
        body = JSON.parse(body);
        if(!body || !body.results || !body.results[0]){
            return callback("fetch another",false);
            //return exports.getAddressFromAWSOld(lat, lng, callback);
        }
        var oResult = {addressServer:'G',formatted_address:body.results[0].formatted_address,address_components:body.results[0].address_components};
        callback(error, oResult);
    });
};
exports.getAddressFromMapMyIndia  = function (lat, lng, callback) {
    if(process.env.NODE_ENV === 'servertest') return callback(null, null);
    const lic_key ="vc795p286g3jn764zca481cd27m28hz3";
    const url = "http://apis.mapmyindia.com/advancedmaps/v1/"+lic_key+"/rev_geocode?lat="+lat+"&lng="+lng;
    request(url, {
        timeout: 5000
    }, function(error, response, body) {
        if (error || !body) {
            //winston.error(error);
            //console.log('map my india limit exceeds');
            return callback(error);
            //return exports.getAddressFromAWS(lat, lng, callback);
        }
        try {
            body = JSON.parse(body);
            if(body && body.results && body.results[0]){
                var oResult = {addressServer:'MMI',formatted_address:body.results[0].formatted_address,results:body.results[0]};
                return callback(error, oResult);
            }else{
                //return exports.getAddressFromAWS(lat, lng, callback);
                return callback("fetch another",false);
            }
        } catch(err) {
            return callback(err);
        }


    });
};
exports.getAddressFromGPSCordinateOrg  = function (lat, lng, callback) {
    if(process.env.NODE_ENV === 'servertest') return callback(null, null);
    const lic_key ="vc795p286g3jn764zca481cd27m28hz3";
    //const url = 'http://www.gps-coordinates.org/my-location.php?lat=28.536659&lng=77.27122499999996';
    const url ='https://maps.googleapis.com/maps/api/js/GeocodeService.Search?5m2&1d'+lat+'&2d'+lng+'&7sUS&9sen&key=AIzaSyAJfAVe_QUH5fYJPR3eyhW4tj67aeLKYAw&callback=_xdc_._v22875&token=90725';
    request(url, {
        timeout: 5000
    }, function(error, response, body) {
        if (error || !body) {
            //winston.error(error);
            console.log('gps-cordinate org limit exceeds');
            return callback(error);
            //return exports.getAddressFromAWS(lat, lng, callback);
        }
        try {
            var result = body.split('(');
            if(result[1]){
                result = result[1];
                body = result.split(')')[0];
            }
            body = JSON.parse(body);
            if(body && body.results && body.results[0]){
                var oResult = {addressServer:'G',formatted_address:body.results[0].formatted_address,address_components:body.results[0].address_components};
                callback(error, oResult);
            }else{
                //return exports.getAddressFromAWS(lat, lng, callback);
                return callback("fetch another",false);
            }
        } catch(err) {
            return callback(err);
        }


    });
};

function cbTest(err,resp){
    console.log(err,resp);
}


//exports.getAddressFromMapMyIndia(23.912817,76.907038,cbTest);
//exports.getAddress(23.912817,76.907038,cbTest);
//exports.getAddressFromAWS(23.912817,76.907038,cbTest);
//exports.getAddressFromGPSCordinateOrg(23.912817,76.907038,cbTest);