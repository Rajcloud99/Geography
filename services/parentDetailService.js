/* Created By Harry
25/03/2019
* * */

const Parent = require('../models/parentDetail');

exports.createParent = async function (oParent,callback){
    try{
        let oSp =  await Parent.create(oParent);
        return oSp;
    }catch(err){
        return {status:'ERROR',message:err && err.message};
    }
};

exports.updateParent = async function (req,callback){
    try{
        let oAddParentDetail = {
            student:req.body.student,
            rfid:req.body.rfid,
            parent1:req.body.parent1,
            parent2:req.body.parent2,
            datetime:new Date(),
            user_id:req.body.user_id,
        };

        let oSp = await Parent.findOneAndUpdateAsync({
            _id: req.body._id
        }, {
            $set: oAddParentDetail
        }, {
            new: true
        });

        return oSp;
    }catch(err){
        return {status:'ERROR',message:err && err.message};
    }
};

exports.getOne = async function (query,callback) {
    try{
        let oFilter = constructFilters(query);
        let findParent = await Parent.findOne(oFilter).lean();
        return findParent;
    } catch (e) {
        throw e;
    }
};

exports.get = async function (query,callback) {
    try{
        let oFilter = constructFilters(query);
        let findParent = await Parent.find(oFilter).lean();
        return findParent;
    } catch (err) {
        return {status:'ERROR',message:err && err.message};
    }
};

exports.deleteRfid = async function (req,callback){
    try {
        let oDelete = await Parent.deleteAsync({
            rfid: req.body.rfid
        });

        resp.status = 'OK';
        resp.data = oSp;
        resp.message = "RFID removed";

    } catch (e) {
        throw e
    }
};

var allowedFilter = ['user_id','name','rfid', 'from', 'to'];
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
                startDate.setSeconds(0);
                startDate.setHours(0);
                startDate.setMinutes(0);
                startDate.setMilliseconds(0);
                fFilter[query.dateType || 'datetime'] = fFilter[query.dateType || 'datetime'] || {};
                fFilter[query.dateType || 'datetime'].$gte = startDate;

            } else if (i === 'to') {
                let endDate = new Date(query[i]);
                endDate.setSeconds(59);
                endDate.setHours(23);
                endDate.setMinutes(59);
                fFilter[query.dateType || 'datetime'] = fFilter[query.dateType || 'datetime'] || {};
                fFilter[query.dateType || 'datetime'].$lte = endDate;
            }  else {
                fFilter[i] = query[i];
            }

        }
    }
    return fFilter;
};

