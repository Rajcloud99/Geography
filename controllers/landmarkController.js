/* Created By kamal
18/12/2019
//db.customlandmarks.createIndex({coordinates:"2dsphere"});
set custome index on collection before release on prod
//db.customlandmarks.getIndexes()
* * */

let router = require('express').Router();
let customLandmarkService = require('../services/customLandmarkService');
let gpsGaadiLandmark = require('../services/gpsgaadiLandmarkService');

router.post('/add', async function (req, res) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    if (!req.body.address || !req.body.name /*|| !req.body.location*/  /*|| !req.body.location.latitude || !req.body.location.longitude*/) {
        resp.message = 'Mandatory field is missing';
        return res.json(resp);
    }

    // if (req.body.location.latitude < 0 || req.body.location.longitude < 0 || req.body.location.longitude > 150 || req.body.location.latitude > 150) {
    //     resp.message = 'cordinates are not valid';
    //     return res.json(resp);
    // }
    var request = {
        user_id: req.body.selected_uid || req.body.user_id,
        selected_uid : req.body.selected_uid || req.body.user_id,
        address: req.body.address,
        location: req.body.location,
        geozone: req.body.geozone,
        name: req.body.name,
        ptype: req.body.ptype,
        type: req.body.type,
        radius: req.body.radius,
        zoom_level: req.body.zoom_level,
        // coordinates: [req.body.location.longitude, req.body.location.latitude],
        created_at:new Date()
      };
    if(req.body.category){
        request.category = req.body.category;
    }
    if(req.body.km){
        request.km = req.body.km;
    }
    if(req.body.dist){
        request.dist = req.body.dist;
    }
    if(req.body.catDet){
        request.catDet = req.body.catDet;
    }
    if( req.body.location &&  req.body.location.latitude &&  req.body.location.longitude){
        request.coordinates = [req.body.location.longitude, req.body.location.latitude];
    } else if( req.body.geozone && req.body.geozone.length){
        request.coordinates = request.coordinates || [];
        req.body.geozone.forEach(obj=>{
            request.coordinates.push( obj.longitude, obj.latitude);
        })
    }

    resp = await customLandmarkService.createCustomLandmark(request);
    if (resp && resp.status == 'OK') {
        // let gResp = await gpsGaadiLandmark.createCustomLandmarkGpsGaadi(request);
        // return res.json(gResp);
        return res.json(resp);
    } else {
        return res.json(resp);
    }
});

router.post('/bulkAdd', async function (req, res) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    if(!req.body.landmarks || req.body.landmarks.length == 0){
        return res.json({status:'ERROR',message:'Share atleast 1 landmark'});
    }
    let aFailed = [];
    let aLandMrk = [];
    let aLandMarkGps = [];
    for(let i=0;i<req.body.landmarks.length;i++){
        if(!req.body.landmarks[i].address){
            req.body.landmarks[i].address = ' '; 
        }
        if (!req.body.landmarks[i].location || !req.body.landmarks[i].name || !req.body.landmarks[i].location.latitude || !req.body.landmarks[i].location.longitude) {
            resp.message = 'Mandatory field is missing';
            resp.status = 'ERROR';
            aFailed.push(req.body.landmarks[i]);
        }
    
        if (req.body.landmarks[i].location.latitude < 0 || req.body.landmarks[i].location.longitude < 0 || req.body.landmarks[i].location.longitude > 150 || req.body.landmarks[i].location.latitude > 150) {
            resp.message = 'cordinates are not valid';
            resp.status = 'ERROR';
            aFailed.push(req.body.landmarks[i]);
        }
        let request = {
            user_id: req.body.selected_uid || req.body.user_id,
            selected_uid : req.body.selected_uid || req.body.user_id,
            address: req.body.landmarks[i].address,
            location: req.body.landmarks[i].location,
            name: req.body.landmarks[i].name,
            coordinates: [req.body.landmarks[i].location.longitude, req.body.landmarks[i].location.latitude],
            created_at:new Date()
          };
        if(req.body.landmarks[i].category){
            request.category = req.body.landmarks[i].category;
        }
        if(req.body.landmarks[i].km){
            request.km = req.body.landmarks[i].km;
        }
        if(req.body.landmarks[i].dist){
            request.dist = req.body.landmarks[i].dist;
        }
        if(req.body.landmarks[i].catDet){
            request.catDet = req.body.landmarks[i].catDet;
        }
        let bulkUpdateQuery = {
			updateOne: {
				filter: {
					user_id : request.user_id,
                    name : request.name
				},
				update: {
					$set: request,
				},
				upsert: true
			}
		};
           
        aLandMrk.push(bulkUpdateQuery);
        aLandMarkGps.push(request);
    }
    if(aFailed.length){
        resp.data = aFailed;
        return res.json(resp);
    }
 
    resp = await customLandmarkService.createBulkCustomLandmark(aLandMrk);
    if (resp && resp.status == 'OK') {
        let oReqLand = {
            user_id: req.body.selected_uid || req.body.user_id,
            selected_uid : req.body.selected_uid || req.body.user_id,
            landmarks:aLandMarkGps
        };
        let gResp = await gpsGaadiLandmark.createBulkCustomLandmarkGpsGaadi(oReqLand);
        return res.json(gResp);
    } else {
        return res.json(resp);
    }
});

router.post('/update', async function (req, res) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    if (!req.body.user_id || !req.body.created_at || !req.body._id) {
        resp.message = 'Mandatory field is missing';
        return res.json(resp);
    }

    // if (req.body.location.latitude < 0 || req.body.location.longitude < 0 || req.body.location.longitude > 150 || req.body.location.latitude > 150) {
    //     resp.message = 'cordinates are not valid';
    //     return res.json(resp);
    // }
    var request = {
        user_id: req.body.selected_uid || req.body.user_id,
        selected_uid : req.body.selected_uid || req.body.user_id,
        address: req.body.address,
        location: req.body.location,
        geozone: req.body.geozone,
        name: req.body.name,
        radius: req.body.radius,
        ptype: req.body.ptype,
        type: req.body.type,
        zoom_level: req.body.zoom_level,
        created_at:req.body.created_at,
        _id:req.body._id,
        modified_at : new Date(),
        // modified_by : req.user.full_name
    };
    if(req.body.category){
        request.category = req.body.category;
    }
    if(req.body.km){
        request.km = req.body.km;
    }
    if(req.body.dist){
        request.dist = req.body.dist;
    }
    if(req.body.catDet){
        request.catDet = req.body.catDet;
    }

    resp = await customLandmarkService.updateCustomLandmark(request);
    if (resp && resp.status == 'OK') {
        // let gResp = await gpsGaadiLandmark.updateCustomLandmarkGpsGaadi(request);
        // return res.json(gResp);
        return res.json(resp);
    } else {
        return res.json(resp);
    }
});

router.post('/remove', async function (req, res) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    if (!req.body.user_id || !req.body.created_at || !req.body._id) {
        resp.message = 'Mandatory field is missing';
        return res.json(resp);
    }

    var request = {
        user_id: req.body.selected_uid || req.body.user_id,
        selected_uid : req.body.selected_uid || req.body.user_id,
        created_at:req.body.created_at,
        _id:req.body._id
    };
    resp = await customLandmarkService.removeCustomLandmark(request);
    if (resp && resp.status == 'OK') {
        // let gResp = await gpsGaadiLandmark.removeCustomLandmarkGpsGaadi(request);
        // return res.json(gResp);
        return res.json(resp);
    } else {
        return res.json(resp);
    }
});

router.post('/get', async function (req, res) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    resp = await customLandmarkService.getCustomLandmark(req.body);
    return res.json(resp);
});

router.post('/reports', async function (req, res) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    resp = await customLandmarkService.landMarkReport(req);
    return res.json({data: resp});
});

// router.route('/reports').post(customLandmarkService.landMarkReport);

module.exports = router;