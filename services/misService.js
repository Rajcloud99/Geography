const MIS = require('../models/mis');
const geocodeService = require("./geocodeService");
const alertService = require("./alertService");
const Alerts = require("../models/alerts");

var allowedFilter = ['clientId','type', 'reportName', 'user', 'serviceType', 'reportAs'];
var isAllowedFilter  = function(sFilter){
    var isAllowed = false;
    if(allowedFilter.indexOf(sFilter)>=0){
        isAllowed =  true;
    }
    return isAllowed;
};
var constructFilters = function(query){
    var fFilter = {};
    for(i in query){
        if(isAllowedFilter(i)){
            // if (i === 'from') {
            //     let startDate = new Date(query[i]);
            //     fFilter[query.dateType || 'datetime'] = fFilter[query.dateType || 'datetime'] || {};
            //     fFilter[query.dateType || 'datetime'].$gte = startDate;
            //
            // } else if (i === 'to') {
            //     let endDate = new Date(query[i]);
            //     fFilter[query.dateType || 'datetime'] = fFilter[query.dateType || 'datetime'] || {};
            //     fFilter[query.dateType || 'datetime'].$lte = endDate;
            // }else
            //     if(i=='name' || i=='address'){
            //     fFilter[i]={$regex: query[i], $options:'i'};
            // }else if(i=='reg_no'){
            //     fFilter[i]={$regex: query[i], $options:'i'};
            // }else if(i=='driver'){
            //     fFilter[i] = {$regex: query[i], $options:'i'};
            // }else if(i=='location' && query.location.longitude){
            //     if(!query.radius){
            //         query.radius = 10000;
            //     }else{
            //         query.radius = query.radius*1000;
            //     }
            //     fFilter['coordinates'] = {$near:{$geometry: {type: "Point" ,coordinates:[query.location.longitude,query.location.latitude]},$maxDistance:query.radius}};
            // } else if (i === 'imei') {
            //     fFilter[i] = {
            //         $in: query[i]
            //     };
            // } else if (i === 'rfid') {
            //     // fFilter[i] = {
            //     //     $in: query[i]
            //     // };
            //     fFilter[i] = query[i];
            // } else {
                fFilter[i] = query[i];
            // }

        }
    }
    return fFilter;
};



exports.getData = async function (oData){
    let resp = {
        status: 'ERROR',
        message: ""
    };
    try{
        let oFil = constructFilters(oData);

        let oProj = oData.projection || {};
        let doc = oData.no_of_docs || 20;
        let skip = (oData.skip -1 ) || 0;
        let sort = oData.sort || {_id:-1};
        skip = skip*doc;
        let resp =  await MIS.find(oFil,oProj).sort(sort).skip(skip).limit(doc);
        return resp;
    }catch(err){
        return {status:'ERROR',message:err && err.message};
    }
};


exports.createMis = async function (oData,callback){
    let resp = {
        status: 'ERROR',
        message: "Successfully Generated"
    };
    try{
        let clientId = MIS.findOne({ clientId: oData.clientId });
        let reportName = MIS.findOne({ reportName: oData.reportName });
        if(clientId && reportName){
            return {
                status: 'ERROR',
                message: "ReportName exits for this client."
            };
        }

        let oL =  await MIS.create(oData);
        resp.status = 'OK';
        resp.data = oL;
        return resp;
    }catch(err){
        return {status:'ERROR',message:err && err.message};
    }
};

exports.upsertMis = async function (oData, getId, callback){
    let resp = {
        status: 'ERROR',
        message: ""
    };
    try{
        // let oQuery = {
        //     type :   oData.type,
        //     reportName  : oData.reportName,
        //     serviceType:oData.serviceType,
        //     reportAs : oData.reportAs,
        //     user : oData.user,
        //     _id : getId
        // };
        let oL = await MIS.update({_id: getId}, {$set: oData});
        // let oL = await MIS.findOneAndUpdate(oQuery, oData, {new: true,upsert: true });
        resp.status = 'OK';
        resp.data = oL;
        resp.message = "alert upserted";
        return resp;
    }catch(err){
        return {status:'ERROR',message:err && err.message};
    }
};

exports.deleteMis = async function (oData,callback){
    try {
        let resp = {
            status: 'ERROR',
            message: ""
        };
        let oDelete = await MIS.remove(oData);

        resp.status = 'OK';
        // resp.data = oSp;
        resp.message = "MIS removed";
        return resp;

    } catch (e) {
        throw e
    }
};