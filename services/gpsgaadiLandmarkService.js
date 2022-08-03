/* Created By kamal
19/12/2019
* * */

var request = require("request");
let gps_url = (config.gpsServer && config.gpsServer.host) || "http:///localhost:8081";
exports.createCustomLandmarkGpsGaadi = async function (request) {
    return new Promise((resolve, reject) => {
        createCustomLandmarkGpsGaadiFn(request, function (err, result) {
            if (err) return reject(err);
            resolve(result);
        });
    });
};


let createCustomLandmarkGpsGaadiFn = async function (query, callback) {
    var options = {
        method: 'POST',
        url: gps_url + '/api/landmark/add',
        headers:
        {
            authorization: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiJrZCJ9.ipXUQ4BVEE6rVP7KAVhSh4bm8JgbU1vkRGY4PFhFUvw',
            'content-type': 'application/json'
        },
        body: query,
        json: true
    };
    request(options, function (error, response, body) {
        if (error) {
            return callback(error, body);
           // throw new Error(error);
        }
        return callback(null, body);
    });
};

    exports.createBulkCustomLandmarkGpsGaadi = async function (request) {
        return new Promise((resolve, reject) => {
            createBulkCustomLandmarkGpsGaadiFn(request, function (err, result) {
                if (err) return reject(err);
                resolve(result);
            });
        });
    };


    let createBulkCustomLandmarkGpsGaadiFn = async function (oLandmarkReq, callback) {
        var options = {
            method: 'POST',
            url: gps_url + '/api/landmark/bulkAdd',
            headers:
            {
                authorization: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiJrZCJ9.ipXUQ4BVEE6rVP7KAVhSh4bm8JgbU1vkRGY4PFhFUvw',
                'content-type': 'application/json'
            },
            body: oLandmarkReq,
            json: true
        };

        request(options, function (error, response, body) {
            if (error) {
                return callback(error, body);
                //throw new Error(error);
            }
            return callback(null, body);
        });

    };
    
    exports.updateCustomLandmarkGpsGaadi = async function (request) {
        return new Promise((resolve, reject) => {
            updateCustomLandmarkGpsGaadiFn(request, function (err, result) {
                if (err) return reject(err);
                resolve(result);
            });
        });
    };


    let updateCustomLandmarkGpsGaadiFn = async function (query, callback) {
        var options = {
            method: 'POST',
            url: gps_url + '/api/landmark/update',
            headers:
            {
                authorization: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiJrZCJ9.ipXUQ4BVEE6rVP7KAVhSh4bm8JgbU1vkRGY4PFhFUvw',
                'content-type': 'application/json'
            },
            body: query,
            json: true
        };

        request(options, function (error, response, body) {
            if (error) {
                throw new Error(error);
            }
            return callback(null, body);
        });

    };


    exports.removeCustomLandmarkGpsGaadi = async function (request) {
        return new Promise((resolve, reject) => {
            removeCustomLandmarkGpsGaadiFn(request, function (err, result) {
                if (err) return reject(err);
                resolve(result);
            });
        });
    };


    let removeCustomLandmarkGpsGaadiFn = async function (query, callback) {
        var options = {
            method: 'POST',
            url: gps_url + '/api/landmark/remove',
            headers:
            {//TODO token hardcoded for kd only
                authorization: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiJrZCJ9.ipXUQ4BVEE6rVP7KAVhSh4bm8JgbU1vkRGY4PFhFUvw',
                'content-type': 'application/json'
            },
            body: query,
            json: true
        };

        request(options, function (error, response, body) {
            if (error) {
                throw new Error(error);
            }
            return callback(null, body);
        });
    };