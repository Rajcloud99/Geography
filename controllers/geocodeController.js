/* Created By kamal
*New ES7 feature used Async and Await to replace promises .then or callback hell
* */

let router = require('express').Router();
let geocodeService = require('../services/geocodeService');
/** GET /reverse/ - Get reverse geocode */
router.route('/').get(geocodeService.getAddress);

router.route('/short').get(geocodeService.getShortAddress);

router.get('/get', async function (req, res) {
    if(!req.query.lat || !req.query.lon){
        return res.status(500).json({status:"ERROR",message:"Latitude or longitude not found in query."});
    }
    if(req.query.lat>90 || req.query.lat<-90 || req.query.lon< -180 || req.query.lon >180){
        return res.status(500).json({status:"ERROR",message:"Latitude or longitude value is non-valid"});
    }
    try{
        let oAddr = await geocodeService.getAddressV2(req);
        if(oAddr && oAddr.status == 'OK'){
            return res.status(200).json(oAddr);
        }else{
            return res.status(500).json(oAddr);
        }
    }catch (e) {
        return res.status(500).json({status:"ERROR",message:e.message || e.toString()});
    }

    
});
module.exports = router;
