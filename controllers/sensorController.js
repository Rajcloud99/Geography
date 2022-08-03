let router = require('express').Router();
let sensorService = require('../services/sensorService');

router.post('/add', async function (req, res) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    let sens_fl = 0;
    if (!req.body.s_id) {
        resp.message = 's_id field is missing';
        return res.json(resp);
    }
    if (!req.body.category) {
        resp.message = 'category field is missing';
        return res.json(resp);
    }
    if (!req.body.user_id) {
        resp.message = 'user_id field is missing';
        return res.json(resp);
    }
    var request = {
        ...req.body,
        user_id: req.body.selected_uid || req.body.user_id,
        selected_uid : req.body.selected_uid || req.body.user_id,
        created_at:new Date()
    };

    if(req.body.calib && req.body.calib.length){
        if( req.body.calib.length > 40){
            resp.message = 'Calibration length should not be gretaer than 40';
            return res.json(resp);
        }
        request.sens_fl = calc_mFact(req.body.calib);  // not saved in db yet
    }

    resp = await sensorService.createSensor(request);
    return res.json(resp);
});

router.post('/update', async function (req, res) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    let sens_fl = 0;
    if (!req.body.user_id || !req.body._id) {
        resp.message = 'Mandatory field is missing';
        return res.json(resp);
    }
    var request = {
        user_id: req.body.selected_uid || req.body.user_id,
        selected_uid : req.body.selected_uid || req.body.user_id,
        address: req.body.address,
        location: req.body.location,
        name: req.body.name,
        created_at:req.body.created_at,
        fill_diff:req.body.fill_diff,
        s_id:req.body.s_id,
        device:req.body.device,
        out_unit:req.body.out_unit,
        conversion_fact:req.body.conversion_fact,
        ver:req.body.ver,
        fill_diff:req.body.fill_diff,
        drain_diff:req.body.drain_diff,
        company: req.body.company,
        calib : req.body.calib,
        _id:req.body._id
    };

    if(req.body.calib && req.body.calib.length){
        if( req.body.calib.length > 40){
            resp.message = 'Calibration length should not be gretaer than 40';
            return res.json(resp);
        }
        request.sens_fl = calc_mFact(req.body.calib); // not saved in db yet
    }

    resp = await sensorService.updateSensor(request);
    return res.json(resp);
});

function calc_mFact(calib){
    let total = 0;
    for(let i=0; i < ( calib.length - 1) ; i++){
        let lvlS = calib[i+1].lvl - calib[i].lvl;
        let valS = calib[i+1].val - calib[i].val;
        total = total + (valS/lvlS);
    }
    let sens_fl = total / calib.length;
    console.log(sens_fl);
    return sens_fl;
}

router.post('/remove', async function (req, res) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    if (!req.body.user_id|| !req.body._id) {
        resp.message = 'Mandatory field is missing';
        return res.json(resp);
    }

    var request = {
        user_id: req.body.selected_uid || req.body.user_id,
        selected_uid : req.body.selected_uid || req.body.user_id,
        created_at:req.body.created_at,
        _id:req.body._id
    };
    resp = await sensorService.removeSensor(request);
    return res.json(resp);
});

router.post('/get', async function (req, res) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    resp = await sensorService.getSensor(req.body);
    return res.json(resp);
});

module.exports = router;
