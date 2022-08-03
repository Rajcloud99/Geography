const router = require('express').Router();
const misService = require('../services/misService');
const Parent = require("../models/parentDetail")
const MIS = require('../models/mis');
const geocodeService = require("../services/geocodeService");
const alertService = require("../services/alertService");


router.post('/get', async function (req, res) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    resp = await misService.getData(req.body);
    return res.json(resp);
});

router.post('/add', async function (req, res) {
    let resp = {
        status: 'ERROR',
        message: ""
    };

    if (!req.body.type || !req.body.reportName || !(req.body.user && req.body.user[0]) || !req.body.serviceType || !req.body.reportAs) {
        resp.message = 'Mandatory field is missing';
        return res.json(resp);
    }
    if ( (req.body.user && req.body.user[0])){
        req.body.user.forEach(obj => {
            if(!obj.emailId || !obj.phoneNo){
                resp.message = 'Email & phone no is Mandatory for user';
                return res.json(resp);
            }
        })

    }
    resp = await misService.createMis(req.body);
    return res.json(resp);
});

router.put('/upsert/:_id', async function (req, res) {
    try{
    let resp = {
        status: 'ERROR',
        message: ""
    };
    if (!req.body.type || !req.body.reportName || !(req.body.user && req.body.user[0]) || !req.body.serviceType || !req.body.reportAs)  {
        resp.message = 'Mandatory field is missing';
        return res.json(resp);
    }
    if ( (req.body.user && req.body.user[0])){
        req.body.user.forEach(obj => {
            if(!obj.emailId || !obj.phoneNo){
                resp.message = 'Email & phone no is Mandatory for user';
                return res.json(resp);
            }
        })
let check =
            resp = await misService.upsertMis(req.body, req.params._id);
            return res.json(resp);

    }



    }catch (e) {
        resp.message = e.message;
        console.error("alert upsert",resp.message);
        return res.json(resp);
    }

});

router.delete('/delete/:_id', async function (req, res) {

    let resp = {};
    try {
        let findMis = await MIS.findOne({_id:req.params._id },{_id:1, type:1});
        if(!(findMis && findMis._id)){
            resp.message = 'MIS does not exists';
            return res.json(resp);
        }
        try{
            resp = await misService.deleteMis({_id:req.params._id });
            return res.status(200).json(resp);
        }catch (e) {
            resp.message = e.message;
            console.error("alert upsert",resp.message);
            return res.json(resp);
        }


    } catch (e) {
        throw e
    }
});


module.exports = router;