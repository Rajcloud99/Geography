const moment = require('moment');
const Sensor = require('../models/sensor');
const mongoose = require("mongoose");

var allowedFilter = ['s_id', 'category', 'device', 'user_id',"_id"];

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
            if (i == 's_id') {
                fFilter[i] = {$regex: query[i], $options: 'i'};
            }else  if (i == '_id') {
                fFilter[i] = mongoose.Types.ObjectId(query[i])
            }else{
                fFilter[i] = query[i];
            }

        }
    }
    return fFilter;
};

exports.getSensor = async function (oSensor) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    try {
        let oFil = constructFilters(oSensor);
        let oProj = oSensor.projection || {
            s_id: 1,
            category: 1,
            device: 1,
            out_unit: 1,
            conversion_fact: 1,
            capacity: 1,
            fill_diff: 1,
            drain_diff: 1,
            created_at: 1,
            sens_fl:1,
            company: 1,
            ver: 1,
            calib: 1
        };
        let doc = oSensor.no_of_docs || 20;
        let skip = (oSensor.skip - 1) || 0;
        skip = skip * doc;
        resp.data =  await Sensor.find(oFil, oProj).sort({_id: -1}).skip(skip).limit(doc);
        resp.status = 'OK';
        return resp;
    } catch (err) {
        return {status: 'ERROR', message: err && err.message};
    }
};

exports.createSensor = async function (oSensor, callback) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    try {
        resp.data = await Sensor.create(oSensor);
        resp.status = 'OK';
        return resp;
    } catch (err) {
        return {status: 'ERROR', message: err && err.message};
    }
};

exports.updateSensor = async function (oSensor, callback) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    try {
        let oL_id = oSensor._id;
        delete oSensor._id;
        resp.data = await Sensor.update({_id: oL_id}, {$set: oSensor});
        resp.status = 'OK';
        return resp;
    } catch (err) {
        return {status: 'ERROR', message: err.toString()};
    }
};

exports.removeSensor = async function (oSensor, callback) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    try {
        let oL_id = oSensor._id;
        delete oSensor._id;
        resp.data = await Sensor.remove({_id: oL_id});
        resp.status = 'OK';
        return resp;
    } catch (err) {
        return {status: 'ERROR', message: err.toString()};
    }
};
