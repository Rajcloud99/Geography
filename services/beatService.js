/*
* * */
const beatModel = Promise.promisifyAll(require('../models/beat'));


var ALLOWED_FILTER = ['user_id','reg_no', 'imei', 'from', 'to'];

function constructFilters(oQuery) {
    let oFilter = {};
    for (let i in oQuery) {
        if (otherUtil.isAllowedFilter(i, ALLOWED_FILTER)) {
            if (i === 'from') {
                let startDate = new Date(oQuery[i]);
                startDate.setSeconds(0);
                startDate.setHours(0);
                startDate.setMinutes(0);
                    oFilter["created_at"] = oFilter["created_at"] || {};
                    oFilter["created_at"].$gte = startDate;

            } else if (i === 'to' ) {
                let endDate = new Date(oQuery[i]);
                endDate.setSeconds(59);
                endDate.setHours(23);
                endDate.setMinutes(59);
                    oFilter["created_at"] = oFilter["created_at"] || {};
                    oFilter["created_at"].$lte = endDate;

            }else if(i=='reg_no'){
                oFilter[i]={$regex: oQuery[i], $options:'i'};
            }else {
                oFilter[i] = oQuery[i];
            }
        }
    }
    return oFilter;
}

exports.get = async function (oBeat){
    let resp = {
        status: 'ERROR',
        message: ""
    };
    try{
        let oFil = constructFilters(oBeat);
        let oProj = oBeat.projection || {user_id:1, reg_no:1, imei:1, startTime:1,endTime:1, beatSection:1, beatSSE:1, beatStart:1, beatEnd:1, _id:1, created_at:1};
        let doc = oBeat.no_of_docs || 20;
        let skip = (oBeat.skip -1 ) || 0;
        skip = skip*doc;
        let oL =  await beatModel.find(oFil,oProj).sort({_id:-1}).skip(skip).limit(doc);

        resp.status = 'OK';
        resp.data = oL;
        return resp;
    }catch(err){
        return {status:'ERROR',message:err && err.message};
    }
};

exports.add = async function (oBeat,callback){
    let resp = {
        status: 'ERROR',
        message: ""
    };
    try{
        oBeat.created_at = new Date();
        let oB =  await beatModel.create(oBeat);
        resp.status = 'OK';
        resp.message =  "Beat Created successfully";
        resp.data = oB;
        return resp;
    }catch(err){
        return {status:'ERROR',message:err && err.message};
    }
};

exports.remove = async function (req,callback){
    let resp = {
        status: 'ERROR',
        message: ""
    };
    try{
        let _id = req.body._id;

        let res =  await beatModel.remove({_id:_id});
        resp.status = 'OK';
        resp.message =  "Deleted Successfully";
        resp.data = res;
        return resp;
    }catch(err){
        return {status:'ERROR',message:err.toString()};
    }
};

exports.update = async function (req,callback){
    let resp = {
        status: 'ERROR',
        message: ""
    };
    try{
        let oL_id = req.body._id;
        let oL =  await beatModel.update({_id:oL_id},{$set:req.body});
        resp.status = 'OK';
        resp.data = oL;
        return resp;
    }catch(err){
        return {status:'ERROR',message:err.toString()};
    }
};
