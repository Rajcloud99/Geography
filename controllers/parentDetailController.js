/* Created By Harry
25/03/2020
* * */

let router = require('express').Router();
let parentDetailService = require('../services/parentDetailService');
let ReportExelService = require('../services/reportExelService');
let Parent = require('../models/parentDetail');

router.post('/add', async function (req, res) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    try {

        if (!req.body.rfid) {
            resp.message = 'RFID is required';
            return res.json(resp);
        }

        if (!req.body.student) {
            resp.message = 'student is required';
            return res.json(resp);
        }
        let findParent = await Parent.findOne({rfid:req.body.rfid, user_id:req.body.user_id },{_id:1, rfid:1}).lean();
        if(findParent && findParent.rfid){
            resp.message = 'RFID is aleady exists';
            return res.status(200).json(resp);
        }

        let oAddParentDetail = {};
        oAddParentDetail = {
            student:req.body.student,
            rfid:req.body.rfid,
            parent1:req.body.parent1,
            parent2:req.body.parent2,
            datetime:new Date(),
            user_id:req.body.user_id,
        };

        let oSp = await parentDetailService.createParent(oAddParentDetail);
        resp.status = 'OK';
        resp.message = 'Added Successfully';
        resp.data = oSp;
        return res.status(200).json(resp);
    } catch (e) {
        throw e
    }
});

router.post('/getOne', async function (req, res) {
    let resp = {};
    try {
        let findParent = await parentDetailService.getOne(req.body);
        resp.data = findParent;
        resp.status     = "OK";
        resp.message    = "Found";
        return res.status(200).json(resp);
    } catch (e) {
        throw e
    }
});

router.post('/update', async function (req, res) {
    let resp = {};
    try {

        if (!req.body.rfid) {
            resp.status = 'ERROR',
            resp.message = 'RFID is required';
            return res.json(resp);
        }

        if (!req.body.student) {
            resp.status = 'ERROR',
            resp.message = 'Student is required';
            return res.json(resp);
        }

        let findParent = await Parent.findOne({rfid:req.body.rfid, user_id:req.body.user_id },{_id:1, rfid:1});
        if(!(findParent && findParent._id)){
            resp.status = 'ERROR',
            resp.message = 'RFID not found';
            return res.json(resp);
        }

        if(findParent.rfid!=req.body.rfid){
            resp.status = 'ERROR',
            resp.message = 'RFID not matched';
            return res.json(resp);
        }

        let oSp = await parentDetailService.updateParent(req);
        resp.status     = 'OK';
        resp.data       = oSp;
        resp.message    = "Updated Successfully";
        return res.status(200).json(resp);

    } catch (e) {
        throw e
    }
});

router.post('/get', async function (req, res) {
    let resp = {};
    try {
        let oData = await parentDetailService.get(req.body);
        resp.status     = "OK";
        resp.message    = "Found";
        resp.data       = oData;
        return res.status(200).json(resp);
    } catch (e) {
        throw e;
    }
});

router.delete('/delete/:_id', async function (req, res) {

    let resp = {};
    try {
        let findParent = await Parent.findOne({rfid:req.body.rfid },{_id:1, rfid:1});
        if(!(findParent && findParent._id)){
            resp.message = 'RFID not exists';
            return res.json(resp);
        }
        resp = await Parent.deleteRfid(req.params._id);
        return res.status(200).json(resp);
    } catch (e) {
        throw e
    }
});
module.exports = router;
