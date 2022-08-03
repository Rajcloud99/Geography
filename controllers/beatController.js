
let router = require('express').Router();
let beatService = require('../services/beatService');
const beatModel = Promise.promisifyAll(require('../models/beat'));

router.post('/add', async function (req, res) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    if (!req.body.reg_no || !req.body.beatSSE || !req.body.beatSection || !req.body.beatStart || !req.body.beatEnd) {
        resp.message = 'Mandatory field is missing';
        return res.json(resp);
    }

    let beatStart = req.body.beatStart;
    let beatEnd = req.body.beatEnd;

    if (!beatStart.latitude || !beatStart.longitude || !beatEnd.longitude || !beatEnd.latitude){
        resp.message = 'Mandatory field is missing';
        return res.json(resp);
     }

    if (beatStart.latitude < 0 || beatStart.longitude < 0 || beatStart.longitude > 150 || beatStart.latitude > 150) {
        resp.message = 'beatStart cordinates are not valid';
        return res.json(resp);
    }

    if (beatEnd.latitude < 0 || beatEnd.longitude < 0 || beatEnd.longitude > 150 || beatEnd.latitude > 150) {
        resp.message = 'beatEnd cordinates are not valid';
        return res.json(resp);
    }

   let aFoundBeat =  await beatModel.find({reg_no: req.body.reg_no, user_id: req.body.user_id});
    if(aFoundBeat && aFoundBeat.length){
        resp.message = 'Beat already Created on this Vehicle';
        return res.json(resp);
    }

    resp = await beatService.add(req.body);

    return res.json(resp);

});


router.post('/get', async function (req, res) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    resp = await beatService.get(req.body);
    return res.json(resp);
});

router.post('/remove', async function (req, res) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    if (!req.body._id) {
        resp.message = 'Mandatory field is missing';
        return res.json(resp);
    }

    resp = await beatService.remove(req);

    return res.json(resp);
});

router.post('/update', async function (req, res) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    if ( !req.body._id) {
        resp.message = 'Mandatory field is missing';
        return res.json(resp);
    }

    if (!req.body.reg_no || !req.body.beatSSE || !req.body.beatSection || !req.body.beatStart || !req.body.beatEnd) {
        resp.message = 'Mandatory field is missing';
        return res.json(resp);
    }

    let beatStart = req.body.beatStart;
    let beatEnd = req.body.beatEnd;

    if (!beatStart.latitude || !beatStart.longitude || !beatEnd.longitude || !beatEnd.latitude){
        resp.message = 'Mandatory field is missing';
        return res.json(resp);
    }

    if (beatStart.latitude < 0 || beatStart.longitude < 0 || beatStart.longitude > 150 || beatStart.latitude > 150) {
        resp.message = 'beatStart cordinates are not valid';
        return res.json(resp);
    }

    if (beatEnd.latitude < 0 || beatEnd.longitude < 0 || beatEnd.longitude > 150 || beatEnd.latitude > 150) {
        resp.message = 'beatEnd cordinates are not valid';
        return res.json(resp);
    }

    let aFoundBeat =  await beatModel.find({reg_no: req.body.reg_no, user_id: req.body.user_id, _id: {$not: {$eq: req.body._id}}});
    if(aFoundBeat && aFoundBeat.length){
        resp.message = 'Beat already Created on this Vehicle';
        return res.json(resp);
    }

    resp = await beatService.update(req);

        return res.json(resp);

});

module.exports = router;