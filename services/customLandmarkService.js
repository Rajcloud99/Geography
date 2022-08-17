/* Created By kamal
18/12/2019
* * */
// const csvDownload = require('../../utils/csv-download');

const custLandMarkRpt = commonUtil.getReports('custlandmarkRpt.js');
const moment = require('moment');

const customlandmark = Promise.promisifyAll(require('../models/customeLandmarks'));

var allowedFilter = ['user_id', 'name', 'address', 'location', 'type', 'ptype'];

var isAllowedFilter = function (sFilter) {
    var isAllowed = false;
    if (allowedFilter.indexOf(sFilter) >= 0) {
        isAllowed = true;
    }
    return isAllowed;
};

var constructFilters = function (query) {//
    var fFilter = {};
    for (i in query) {
        if (isAllowedFilter(i)) {
            if (i == 'name' || i == 'address') {
                fFilter[i] = {$regex: query[i], $options: 'i'};
            } else if (i == 'location' && query.location.longitude) {
                if (!query.radius) {
                    query.radius = 10000;
                } else {
                    query.radius = query.radius * 1000;
                }
                fFilter['coordinates'] = {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [query.location.longitude, query.location.latitude]
                        }, $maxDistance: query.radius
                    }
                };
            } else {
                fFilter[i] = query[i];
            }

        }
    }
    return fFilter;
};

exports.getCustomLandmark = async function (oLandmark) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    try {
        let oFil = constructFilters(oLandmark);
        let oProj = oLandmark.projection || {
            name: 1,
            location: 1,
            address: 1,
            _id: 1,
            created_at: 1,
            modified_at: 1,
            modified_by: 1,
            category: 1,
            km: 1,
            dist: 1,
            catDet: 1,
            ptype: 1,
            type: 1,
            radius: 1,
            zoom_level: 1,
            geozone: 1,
        };
        let doc = oLandmark.no_of_docs || 20;
        let skip = (oLandmark.skip - 1) || 0;
        skip = skip * doc;
        let oL;
        if (oFil.coordinates) {//can not do custom sort with $near geo sort
            oL = await customlandmark.find(oFil, oProj).skip(skip).limit(doc);
        } else {
            oL = await customlandmark.find(oFil, oProj).sort({_id: -1}).skip(skip).limit(doc);
        }
        resp.status = 'OK';
        resp.data = oL;
        return resp;
    } catch (err) {
        return {status: 'ERROR', message: err && err.message};
    }
};

exports.createCustomLandmark = async function (oLandmark, callback) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    try {
        let oL = await customlandmark.create(oLandmark);
        resp.status = 'OK';
        resp.data = oL;
        return resp;
    } catch (err) {
        return {status: 'ERROR', message: err && err.message};
    }
};

exports.createBulkCustomLandmark = async function (aLandmark, callback) {
    let resp = {
        status: 'OK',
        message: "",
        errors: []
    };
    const batchSize = 100;
    for (let i = 0; i < aLandmark.length; i += batchSize) {
        try {
            await customlandmark.bulkWrite(aLandmark.slice(i, i + batchSize));
        } catch (err) {
            resp.errors.push({status: 'ERROR', message: err && err.message});
        }
    }
    if (resp.errors.length) {
        resp.status = 'ERROR';
    }
    return resp;
};

exports.updateCustomLandmark = async function (oLandmark, callback) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    try {
        let oL_id = oLandmark._id;
        delete oLandmark._id;
        let oL = await customlandmark.update({_id: oL_id}, {$set: oLandmark});
        resp.status = 'OK';
        resp.data = oL;
        return resp;
    } catch (err) {
        return {status: 'ERROR', message: err.toString()};
    }
};

exports.removeCustomLandmark = async function (oLandmark, callback) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    try {
        let oL_id = oLandmark._id;
        delete oLandmark._id;
        let oL = await customlandmark.remove({_id: oL_id});
        resp.status = 'OK';
        resp.data = oL;
        return resp;
    } catch (err) {
        return {status: 'ERROR', message: err.toString()};
    }
};

exports.landMarkReport = async function (req, callback) {

    let skip = 1;
    let no_of_docs = 5000;
    let sortQ = {_id: -1};

    let oFil = constructFilters(req.body);

    const aggrQuery = [];
    aggrQuery.push({
        $match: oFil
    });

    aggrQuery.push(
        {$sort: sortQ},
        {
            $skip: ((no_of_docs * skip) - no_of_docs)
        },
        {
            $limit: no_of_docs
        });

    aggrQuery.push({
        $project: {
            'user_id': true,
            'name': true,
            'address': true,
            'category': true,
            'location': true,
            'km': true,
            'dist': true,
            'catDet': true,
            'coordinates': true,
            'created_at': true,
            'modified_at': true,
        }
    });


    let downloadPath = await new csvDownload(customlandmark, aggrQuery, {
        filePath: `${req.body.user_id}/landMark`,
        fileName: `landMark_Report_${moment().format('DD-MM-YYYY')}`
    }).exec(custLandMarkRpt.transform, req);


    return {
        status: "SUCCESS",
        message: 'report download available',
        url: downloadPath
    };


};
