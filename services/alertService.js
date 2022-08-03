/* Created By kamal
18/12/2019
* * */

const Alerts = require('../models/alerts');

exports.getAlerts = async function (oAlerts){
    let resp = {
        status: 'ERROR',
        message: ""
    };
    try{
        let oFil = constructFilters(oAlerts);
        let oProj = oAlerts.projection || {};
        let doc = oAlerts.no_of_docs || 20;
        let skip = (oAlerts.skip -1 ) || 0;
        let sort = oAlerts.sort || {_id:-1};
        skip = skip*doc;
        let oL;
        if(oFil.coordinates){//can not do custom sort with $near geo sort
            oL =  await Alerts.find(oFil,oProj).skip(skip).limit(doc);
        }else{
            oL =  await Alerts.find(oFil,oProj).sort(sort).skip(skip).limit(doc);
        }
        resp.status = 'OK';
        resp.data = oL;
        return resp;
    }catch(err){
        return {status:'ERROR',message:err && err.message};
    }
};

exports.getAlertsAction = async function (oAlerts){
    let resp = {
        status: 'ERROR',
        message: ""
    };
    try{
        let oFil = constructFilters(oAlerts);
        let oProj = oAlerts.projection || {};
        let doc = oAlerts.no_of_docs || 20;
        let skip = (oAlerts.skip -1 ) || 0;
        let sort = oAlerts.sort || {_id:-1};
        skip = skip*doc;
        oFil['actions.0'] = {$exists: true};
        let fdData = await Alerts.aggregate([
            {
                $match: oFil
            },
            {
                $group: {
                    _id: '$reg_no',
                    alerts: {$push: '$$ROOT'}
                }
            }
        ]);
        resp.status = 'OK';
        resp.data = fdData;
        return resp;
    }catch(err){
        return {status:'ERROR',message:err && err.message};
    }
};

exports.getDayWiseTagAction = async function (oAlerts){
    let resp = {
        status: 'ERROR',
        message: ""
    };
    try{
        let oFil = constructFilters(oAlerts);
        let oProj = oAlerts.projection || {};
        let doc = oAlerts.no_of_docs || 20;
        let skip = (oAlerts.skip -1 ) || 0;
        let sort = oAlerts.sort || {_id:-1};
        skip = skip*doc;
        //oFil['actions.0'] = {$exists: true};
        let fdData = await Alerts.aggregate([
            {
                $match: oFil
            },
            {
                "$addFields": {
                    "day": {
                        "$dateToString": {
                            "format": "%Y-%m-%d",
                            "date": "$datetime"
                        }
                    },
                    "driver": "$driver"
                }
            },
            {
                "$group": {
                    "_id": {
                        "day": "$day",
                        "driver": "$driver"
                    },
                    "alerts": {
                        "$push": "$$ROOT"
                    }
                }
            },
            { "$group": {
                    "_id": { "day": "$_id.day" },
                    "data": { "$push": { "student": "$_id.driver", "detail": "$alerts" }}
            }}
        ]).sort({_id:1});
        resp.status = 'OK';
        resp.data = fdData;
        return resp;
    }catch(err){
        return {status:'ERROR',message:err && err.message};
    }
};

exports.createAlerts = async function (oAlert,callback){
    let resp = {
        status: 'ERROR',
        message: "Successfully Generated"
    };
    try{
        let oL =  await Alerts.create(oAlert);
        resp.status = 'OK';
        resp.data = oL;
        return resp;
    }catch(err){
        return {status:'ERROR',message:err && err.message};
    }
};

exports.upsertAlerts = async function (oAlert,callback){
    let resp = {
        status: 'ERROR',
        message: ""
    };
    try{
        let oQuery = {
             imei :   oAlert.imei,
            datetime  : oAlert.datetime,
            code:oAlert.code
        };
        let oL = await Alerts.findOneAndUpdate(oQuery, oAlert, {new: true,upsert: true });
        resp.status = 'OK';
        resp.data = oL;
        resp.message = "alert upserted";
        return resp;
    }catch(err){
        return {status:'ERROR',message:err && err.message};
    }
};

var allowedFilter = ['user_id','name','address','location', 'code', 'rfid', 'imei', 'from', 'to', 'driver', 'reg_no'];
var isAllowedFilter  = function(sFilter){
    var isAllowed = false;
    if(allowedFilter.indexOf(sFilter)>=0){
        isAllowed =  true;
    }
    return isAllowed;
};
var constructFilters = function(query){//
    var fFilter = {};
    for(i in query){
        if(isAllowedFilter(i)){
            if (i === 'from') {
                let startDate = new Date(query[i]);
                fFilter[query.dateType || 'datetime'] = fFilter[query.dateType || 'datetime'] || {};
                fFilter[query.dateType || 'datetime'].$gte = startDate;

            } else if (i === 'to') {
                let endDate = new Date(query[i]);
                fFilter[query.dateType || 'datetime'] = fFilter[query.dateType || 'datetime'] || {};
                fFilter[query.dateType || 'datetime'].$lte = endDate;
            }else if(i=='name' || i=='address'){
                fFilter[i]={$regex: query[i], $options:'i'};
            }else if(i=='reg_no'){
                fFilter[i]={$regex: query[i], $options:'i'};
            }else if(i=='driver'){
                fFilter[i] = {$regex: query[i], $options:'i'};
            }else if(i=='location' && query.location.longitude){
                if(!query.radius){
                    query.radius = 10000;
                }else{
                    query.radius = query.radius*1000;
                }
                fFilter['coordinates'] = {$near:{$geometry: {type: "Point" ,coordinates:[query.location.longitude,query.location.latitude]},$maxDistance:query.radius}};
            } else if (i === 'imei') {
                fFilter[i] = {
                    $in: query[i]
                };
            } else if (i === 'rfid') {
                // fFilter[i] = {
                //     $in: query[i]
                // };
                fFilter[i] = query[i];
            } else {
                fFilter[i] = query[i];
            }

        }
    }
    return fFilter;
};
