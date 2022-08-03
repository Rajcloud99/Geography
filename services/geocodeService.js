'use strict';
/*
* Created By Kamal 28/02/2018
* */

const postal = Promise.promisifyAll(require('../models/postal'));
const locality = Promise.promisifyAll(require('../models/locality'));
const addressService = require('../services/addressService');
const postalService = require('../services/postalAdressService');
const distanceUtil = require('../utils/distanceUtil');

function cb(err,resp) {
    //do nothing
}

module.exports.getAddress = async function(req, res, next) {
    try {
        if(!req.query.lat || !req.query.lon){
            return res.status(500).json({status:"ERROR",message:"Latitude or longitude not found in query."});
        }
        if(req.query.lat>90 || req.query.lat<-90 || req.query.lon<-180 || req.query.lon>180){
            return res.status(500).json({status:"ERROR",message:"Latitude or longitude value is non-valid"});
        }
        let olDataQuery = {location:{$near:{$geometry: {type: "Point" ,coordinates:[req.query.lon,req.query.lat]},$maxDistance:3000}}};
        let lData = await locality.findOne(olDataQuery);
        lData=JSON.parse(JSON.stringify(lData));
        req.lData = lData;
        let opDataQuery = {location:{$near:{$geometry: {type: "Point" ,coordinates:[req.query.lon,req.query.lat]},$maxDistance:16000}}};
        let pData =  await postal.findOne(opDataQuery);
        let fetchAddrFromMMI = false;
        let fetchAddrFromG = false;
        let resData = {};
        resData.lat = req.query.lat;
        resData.lon = req.query.lon;
        resData.display_name = "";
        let detail = {};
        let distanceFromlData=10000,distanceFrompData=10000;
        if(!pData){
            fetchAddrFromMMI = true;
        }else {
            pData = JSON.parse(JSON.stringify(pData));
            req.pData = pData;
            if (lData && lData.location) {
                distanceFromlData = parseInt(distanceUtil.getDistanceFromLatLonInKm(req.query.lat, req.query.lon, lData.location[1], lData.location[0]) * 100) / 100;
            }
            if (pData && pData.location) {
                distanceFrompData = parseInt(distanceUtil.getDistanceFromLatLonInKm(req.query.lat, req.query.lon, pData.location[1], pData.location[0]) * 100) / 100;
            }
            //detail.distance = distanceFromlData < distanceFrompData ? distanceFromlData : distanceFrompData;
            detail.distance = distanceFrompData;
            //calc dist 
            if (lData && lData.asciiname && lData.asciiname !== "" && (distanceFromlData - distanceFrompData) < 5) {
                if (detail.distance > 0.1)
                    resData.display_name += detail.distance + " km from ";
                resData.display_name += lData.asciiname;
                detail.locality = lData.asciiname;
            }
            if (pData.formatted_address) {
                let lFAddr = pData.formatted_address.toLowerCase();
                if (lFAddr.search(resData.display_name.toLowerCase()) < 0) {
                    resData.display_name = resData.display_name + " " + pData.formatted_address;
                } else {
                    resData.display_name = pData.formatted_address;
                }
                let lDispName  = resData.display_name.toLowerCase();
                if (pData["place_name_s"] && pData["place_name_s"] !== "" && lDispName.search(pData.place_name_s.toLowerCase()) < 0) {
                    resData.display_name = pData.place_name_s + " " + resData.display_name;
                }
                //remove fillers
                resData.display_name = resData.display_name.replace('Unnamed Road,','');
                resData.display_name = resData.display_name.replace('Unnamed Road','');
                resData.display_name = resData.display_name.replace('unnamed road,','');
                resData.display_name = resData.display_name.replace('unnamed road','');
                resData.display_name = resData.display_name.replace('unnamed','');
            } else {
                if (pData["place_name"] && pData["place_name"] !== "") {
                    detail.place = pData["place_name"];
                    if (detail.place != detail.locality) {
                        resData.display_name = resData.display_name === "" ? "" : resData.display_name + ", ";
                        resData.display_name += pData["place_name"];
                    }
                }
                if (pData["admin3"] && pData["admin3"] !== "") {
                    detail.zone = pData["admin3"];
                    if (detail.zone != detail.place) {
                        resData.display_name = resData.display_name === "" ? "" : resData.display_name + ", ";
                        resData.display_name += pData["admin3"];
                    }
                }
                if (pData["admin2"] && pData["admin2"] !== "") {
                    detail.city = pData["admin2"];
                    if (detail.city != detail.zone) {
                        resData.display_name = resData.display_name === "" ? "" : resData.display_name + ", ";
                        resData.display_name += pData["admin2"];
                    }
                }
                if (pData["admin1"] && pData["admin1"] !== "") {
                    detail.state = pData["admin1"];
                    if (detail.state != detail.city) {
                        resData.display_name = resData.display_name === "" ? "" : resData.display_name + ", ";
                        resData.display_name += pData["admin1"];
                    }
                }
                if (pData["postal_code"] && pData["postal_code"] !== "") {
                    resData.display_name = resData.display_name === "" ? "" : resData.display_name + ", ";
                    detail.postal = pData["postal_code"];
                    resData.display_name += pData["postal_code"];
                }
                if (req.query.detail === 'true') {
                    resData.detail = detail;
                }
            }
            if (detail && pData && detail.distance < 1) {
                return res.status(200).json(resData);
            } else if(pData.country_code == 'IN' || pData.country_name == 'India'){
                fetchAddrFromMMI = true;
            }
        }
        if(fetchAddrFromMMI) {
            addressService.getAddressFromMapMyIndia(req.query.lat,req.query.lon,function (err,oAddress) {
                if (err) {
                    fetchAddrFromG = true;
                    //return res.status (500).json ({message:err});
                }
                if(oAddress && oAddress.addressServer && oAddress.formatted_address && oAddress.results && oAddress.results.area == 'India'){
                    let oSendToInsert = postalService.prepareForInsert(oAddress);
                    let updateNow = true;
                    if(req.pData && req.pData.place_name == oSendToInsert.oUpdate.place_name){//same place came to update
                        updateNow = false;
                    }
                    if(oSendToInsert.oUpdate && updateNow){
                        oSendToInsert.oUpdate.location = [req.query.lon,req.query.lat];
                        postalService.insertPostalAddr(oSendToInsert.oUpdate,cb);
                    }
                    resData.display_name = oAddress.formatted_address;
                    return res.status (200).json (resData);
                }else{
                    fetchAddrFromG = true;
                    addressService.getAddressGlobal(req.query.lat,req.query.lon,function (err,oAddress2) {
                        if (err) {
                            if(resData && resData.display_name){
                                return res.status(200).json(resData);
                            }else{
                                return res.status(500).json({message: err});
                            }  
                        }

                        if(oAddress2 && oAddress2.addressServer && oAddress2.formatted_address && oAddress2.address_components){
                            let oSendToInsert = postalService.prepareForInsert(oAddress2);
                            let updateNow = true;
                            if(req.pData && req.pData.place_name == oSendToInsert.oUpdate.place_name){//same place came to update
                                updateNow = false;
                            }
                            if(oSendToInsert.oUpdate && updateNow){
                                oSendToInsert.oUpdate.location = [req.query.lon,req.query.lat];
                                postalService.insertPostalAddr(oSendToInsert.oUpdate,cb);
                            }
                            resData.display_name = oAddress2.formatted_address;
                            return res.status (200).json (resData);
                        }else{
                            resData.display_name = oAddress2.formatted_address;
                            return res.status(200).json(resData);
                        }
                    })
                }
            });
        }else{
            fetchAddrFromG = true;
            addressService.getAddressGlobal(req.query.lat,req.query.lon,function (err,oAddress2) {
                if (err) {
                    if(resData && resData.display_name){
                        return res.status(200).json(resData);
                    }else{
                        return res.status(500).json({message: err});
                    } 
                }
                if(oAddress2 && oAddress2.addressServer && oAddress2.formatted_address && oAddress2.address_components){
                    let oSendToInsert = postalService.prepareForInsert(oAddress2);
                    let updateNow = true;
                    if(req.pData && req.pData.place_name == oSendToInsert.oUpdate.place_name){//same place came to update
                        updateNow = false;
                    }
                    if(oSendToInsert.oUpdate && updateNow){
                        oSendToInsert.oUpdate.location = [req.query.lon,req.query.lat];
                        postalService.insertPostalAddr(oSendToInsert.oUpdate,cb);
                    }
                    resData.display_name = oAddress2.formatted_address;
                    return res.status (200).json (resData);
                }else{
                    resData.display_name = oAddress2.formatted_address;
                    return res.status(200).json(resData);
                }
            })
        }
    } catch (err) {
        next(err);
    }
}

module.exports.getShortAddress = async function(req, res, next) {
    try {
        if(!req.query.lat || !req.query.lon){
            return res.status(500).json({status:"ERROR",message:"Latitude or longitude not found in query."});
        }
        if(req.query.lat>90 || req.query.lat<-90 || req.query.lon<-180|| req.query.req>180){
            return res.status(500).json({status:"ERROR",message:"Latitude or longitude value is non-valid"});
        }
        let olDataQuery = {location:{$near:{$geometry: {type: "Point" ,coordinates:[req.query.lon,req.query.lat]},$maxDistance:3000}}};
        let lData = await locality.findOne(olDataQuery);
        lData=JSON.parse(JSON.stringify(lData));
        req.lData = lData;
        let opDataQuery = {location:{$near:{$geometry: {type: "Point" ,coordinates:[req.query.lon,req.query.lat]},$maxDistance:16000}}};
        let pData =  await postal.findOne(opDataQuery);
        let fetchAddrFromMMI = false;
        let fetchAddrFromG = false;
        let resData = {};
        resData.lat = req.query.lat;
        resData.lon = req.query.lon;
        resData.display_name = "";
        let detail = {};
        let distanceFromlData=10000,distanceFrompData=10000;
        if(!pData){
            fetchAddrFromMMI = true;
        }else {
            pData = JSON.parse(JSON.stringify(pData));
            req.pData = pData;
            if (lData && lData.location) {
                distanceFromlData = parseInt(distanceUtil.getDistanceFromLatLonInKm(req.query.lat, req.query.lon, lData.location[1], lData.location[0]) * 100) / 100;
            }
            if (pData && pData.location) {
                distanceFrompData = parseInt(distanceUtil.getDistanceFromLatLonInKm(req.query.lat, req.query.lon, pData.location[1], pData.location[0]) * 100) / 100;
            }
            //detail.distance = distanceFromlData < distanceFrompData ? distanceFromlData : distanceFrompData;
            detail.distance = distanceFrompData;
            if (lData && lData.asciiname && lData.asciiname !== "" && distanceFromlData - distanceFrompData < 10) {
                if (detail.distance > 0.1)
                    resData.display_name += detail.distance + " km from ";
                resData.display_name += lData.asciiname;
                detail.locality = lData.asciiname;
            }
        /*
            if (pData.formatted_address) {
                let lFAddr = pData.formatted_address.toLowerCase();
                if (lFAddr.search(resData.display_name.toLowerCase()) < 0) {
                    resData.display_name = resData.display_name + " " + pData.formatted_address;
                } else {
                    resData.display_name = pData.formatted_address;
                }
                let lDispName  = resData.display_name.toLowerCase();
                if (pData["place_name_s"] && pData["place_name_s"] !== "" && lDispName.search(pData.place_name_s.toLowerCase()) < 0) {
                    resData.display_name = pData.place_name_s + " " + resData.display_name;
                }
                removeFilers(resData.display_name);
                return res.status(200).json(resData);
            } else {
                if (pData["place_name"] && pData["place_name"] !== "") {
                    detail.place = pData["place_name"];
                    if (detail.place != detail.locality) {
                        resData.display_name = resData.display_name === "" ? "" : resData.display_name + ", ";
                        resData.display_name += pData["place_name"];
                    }
                }
        */
            if (pData["admin4"] && pData["admin4"] !== "") {
                detail.locality = pData["admin4"];
                if (detail.locality != detail.place) {
                    resData.display_name = resData.display_name === "" ? "" : resData.display_name + ", ";
                    resData.display_name += pData["admin4"];
                }
            }
            if (pData["admin3"] && pData["admin3"] !== "") {
                detail.zone = pData["admin3"];
                if (detail.zone != detail.place) {
                    resData.display_name = resData.display_name === "" ? "" : resData.display_name + ", ";
                    resData.display_name += pData["admin3"];
                }
            }
            let adm2 = pData["admin2"] && pData["admin2"].toLowerCase();
            let adm3 = pData["admin3"] && pData["admin3"].toLowerCase();
            let contains_adm3;
            if(adm2 && adm3 && adm2.search(adm3)> -1){
                contains_adm3 = true;
            }
            if (pData["admin2"] && pData["admin2"] !== "" && !contains_adm3) {
                detail.city = pData["admin2"];
                if (detail.city != detail.zone) {
                    resData.display_name = resData.display_name === "" ? "" : resData.display_name + ", ";
                    resData.display_name += pData["admin2"];
                }
            }
            if (pData["admin1"] && pData["admin1"] !== "") {
                detail.state = pData["admin1"];
                if (detail.state != detail.city) {
                    resData.display_name = resData.display_name === "" ? "" : resData.display_name + ", ";
                    resData.display_name += pData["admin1"];
                }
            }
            /* if (pData["postal_code"] && pData["postal_code"] !== "") {
                 resData.display_name = resData.display_name === "" ? "" : resData.display_name + ", ";
                 detail.postal = pData["postal_code"];
                 resData.display_name += pData["postal_code"];
             }*/
            if (req.query.detail == 'true') {
                resData.detail = detail;
            }
            if (detail && pData && detail.distance < 1) {
                return res.status(200).json(resData);
            } else if(pData.country_code == 'IN' || pData.country_name == 'India'){
                fetchAddrFromMMI = true;
            }
        }
        if(fetchAddrFromMMI) {
            addressService.getAddressFromMapMyIndia(req.query.lat,req.query.lon,function (err,oAddress) {
                if (err) {
                    if(resData && resData.display_name){
                        return res.status(200).json(resData);
                    }else{
                        return res.status(500).json({message: err});
                    } 
                }
                if(oAddress && oAddress.addressServer && oAddress.formatted_address && oAddress.results && oAddress.results.area == 'India'){
                    let oSendToInsert = postalService.prepareForInsert(oAddress);
                    let updateNow = true;
                    if(req.pData && req.pData.place_name == oSendToInsert.oUpdate.place_name){//same place came to update
                        updateNow = false;
                    }
                    if(oSendToInsert.oUpdate && updateNow){
                        oSendToInsert.oUpdate.location = [req.query.lon,req.query.lat];
                        postalService.insertPostalAddr(oSendToInsert.oUpdate,cb);
                    }
                    resData.display_name = oAddress.formatted_address;
                    return res.status (200).json (resData);
                }else{
                    fetchAddrFromG = true;
                    addressService.getAddressGlobal(req.query.lat,req.query.lon,function (err,oAddress2) {
                        if (err) {
                            if(resData && resData.display_name){
                                return res.status(200).json(resData);
                            }else{
                                return res.status(500).json({message: err});
                            } 
                        }

                        if(oAddress2 && oAddress2.addressServer && oAddress2.formatted_address && oAddress2.address_components){
                            let oSendToInsert = postalService.prepareForInsert(oAddress2);
                            let updateNow = true;
                            if(req.pData && req.pData.place_name == oSendToInsert.oUpdate.place_name){//same place came to update
                                updateNow = false;
                            }
                            if(oSendToInsert.oUpdate && updateNow){
                                oSendToInsert.oUpdate.location = [req.query.lon,req.query.lat];
                                postalService.insertPostalAddr(oSendToInsert.oUpdate,cb);
                            }
                            resData.display_name = oAddress2.formatted_address;
                            return res.status (200).json (resData);
                        }else{
                            resData.display_name = oAddress2.formatted_address;
                            return res.status(200).json(resData);
                        }
                    })
                }
            });
        }else{
            fetchAddrFromG = true;
            addressService.getAddressGlobal(req.query.lat,req.query.lon,function (err,oAddress2) {
                if (err) {
                    if(resData && resData.display_name){
                        return res.status(200).json(resData);
                    }else{
                        return res.status(500).json({message: err});
                    } 
                }
                if(oAddress2 && oAddress2.addressServer && oAddress2.formatted_address && oAddress2.address_components){
                    let oSendToInsert = postalService.prepareForInsert(oAddress2);
                    let updateNow = true;
                    if(req.pData && req.pData.place_name == oSendToInsert.oUpdate.place_name){//same place came to update
                        updateNow = false;
                    }
                    if(oSendToInsert.oUpdate && updateNow){
                        oSendToInsert.oUpdate.location = [req.query.lon,req.query.lat];
                        postalService.insertPostalAddr(oSendToInsert.oUpdate,cb);
                    }
                    resData.display_name = oAddress2.formatted_address;
                    return res.status (200).json (resData);
                }else{
                    resData.display_name = oAddress2.formatted_address;
                    return res.status(200).json(resData);
                }
            })
        }
    } catch (err) {
        next(err);
    }
}

module.exports.getAddressV2 = async function(req) {
    try {
        req.query.lon = req.query.lon || req.query.lng;
        let olDataQuery = {location:{$near:{$geometry: {type: "Point" ,coordinates:[req.query.lon,req.query.lat]},$maxDistance:3000}}};
        let lData = await locality.findOne(olDataQuery);
        lData=JSON.parse(JSON.stringify(lData));
        req.lData = lData;
        let opDataQuery = {location:{$near:{$geometry: {type: "Point" ,coordinates:[req.query.lon,req.query.lat]},$maxDistance:16000}}};
        let pData =  await postal.findOne(opDataQuery);
        let fetchAddrFromMMI = false;
        let fetchAddrFromG = false;
        let resData = {};
        resData.lat = req.query.lat;
        resData.lon = req.query.lon;
        resData.display_name = "";
        let detail = {};
        let distanceFromlData=10000,distanceFrompData=10000;
        if(!pData){
            fetchAddrFromMMI = true;
        }else {
            pData = JSON.parse(JSON.stringify(pData));
            req.pData = pData;
            if (lData && lData.location) {
                distanceFromlData = parseInt(distanceUtil.getDistanceFromLatLonInKm(req.query.lat, req.query.lon, lData.location[1], lData.location[0]) * 100) / 100;
            }
            if (pData && pData.location) {
                distanceFrompData = parseInt(distanceUtil.getDistanceFromLatLonInKm(req.query.lat, req.query.lon, pData.location[1], pData.location[0]) * 100) / 100;
            }
            //detail.distance = distanceFromlData < distanceFrompData ? distanceFromlData : distanceFrompData;
            detail.distance = distanceFrompData;
            if (detail && pData && detail.distance < 1) {
                if (lData && lData.asciiname && lData.asciiname !== "" && distanceFromlData - distanceFrompData < 5) {
                    if (detail.distance > 0.1)
                        resData.display_name += detail.distance + " km from ";
                    resData.display_name += lData.asciiname;
                    detail.locality = lData.asciiname;
                }
                if (pData.formatted_address) {
                    let lFAddr = pData.formatted_address.toLowerCase();
                    if (lFAddr.search(resData.display_name.toLowerCase()) < 0) {
                        resData.display_name = resData.display_name + " " + pData.formatted_address;
                    } else {
                        resData.display_name = pData.formatted_address;
                    }
                    let lDispName  = resData.display_name.toLowerCase();
                    if (pData["place_name_s"] && pData["place_name_s"] !== "" && lDispName.search(pData.place_name_s.toLowerCase()) < 0) {
                        resData.display_name = pData.place_name_s + " " + resData.display_name;
                    }
                    //remove fillers
                    resData.display_name = resData.display_name.replace('Unnamed Road,','');
                    resData.display_name = resData.display_name.replace('Unnamed Road','');
                    resData.display_name = resData.display_name.replace('unnamed road,','');
                    resData.display_name = resData.display_name.replace('unnamed road','');
                    resData.display_name = resData.display_name.replace('unnamed','');
                    resData.status ="OK";
                    return resData;
                } else {
                    if (pData["place_name"] && pData["place_name"] !== "") {
                        detail.place = pData["place_name"];
                        if (detail.place != detail.locality) {
                            resData.display_name = resData.display_name === "" ? "" : resData.display_name + ", ";
                            resData.display_name += pData["place_name"];
                        }
                    }
                    if (pData["admin3"] && pData["admin3"] !== "") {
                        detail.zone = pData["admin3"];
                        if (detail.zone != detail.place) {
                            resData.display_name = resData.display_name === "" ? "" : resData.display_name + ", ";
                            resData.display_name += pData["admin3"];
                        }
                    }
                    if (pData["admin2"] && pData["admin2"] !== "") {
                        detail.city = pData["admin2"];
                        if (detail.city != detail.zone) {
                            resData.display_name = resData.display_name === "" ? "" : resData.display_name + ", ";
                            resData.display_name += pData["admin2"];
                        }
                    }
                    if (pData["admin1"] && pData["admin1"] !== "") {
                        detail.state = pData["admin1"];
                        if (detail.state != detail.city) {
                            resData.display_name = resData.display_name === "" ? "" : resData.display_name + ", ";
                            resData.display_name += pData["admin1"];
                        }
                    }
                    if (pData["postal_code"] && pData["postal_code"] !== "") {
                        resData.display_name = resData.display_name === "" ? "" : resData.display_name + ", ";
                        detail.postal = pData["postal_code"];
                        resData.display_name += pData["postal_code"];
                    }
                    if (req.query.detail === 'true') {
                        resData.detail = detail;
                    }
                    resData.status ="OK";
                    return resData;
                }
            } else if(pData.country_code == 'IN' || pData.country_name == 'India'){
                fetchAddrFromMMI = true;
            }
        }
        if(fetchAddrFromMMI) {
            addressService.getAddressFromMapMyIndia(req.query.lat,req.query.lon,function (err,oAddress) {
                if (err) {
                    fetchAddrFromG = true;
                }
                if(oAddress && oAddress.addressServer && oAddress.formatted_address && oAddress.results && oAddress.results.area == 'India'){
                    let oSendToInsert = postalService.prepareForInsert(oAddress);
                    let updateNow = true;
                    if(req.pData && req.pData.place_name == oSendToInsert.oUpdate.place_name){//same place came to update
                        updateNow = false;
                    }
                    if(oSendToInsert.oUpdate && updateNow){
                        oSendToInsert.oUpdate.location = [req.query.lon,req.query.lat];
                        postalService.insertPostalAddr(oSendToInsert.oUpdate,cb);
                    }
                    resData.display_name = oAddress.formatted_address;
                    resData.status ="OK";
                    return resData;
                }else{
                    fetchAddrFromG = true;
                    addressService.getAddressGlobal(req.query.lat,req.query.lon,function (err,oAddress2) {
                        if (err) {
                            let oErr = {status:"ERROR",message:err.toString()};
                            return oErr;
                        }

                        if(oAddress2 && oAddress2.addressServer && oAddress2.formatted_address && oAddress2.address_components){
                            let oSendToInsert = postalService.prepareForInsert(oAddress2);
                            let updateNow = true;
                            if(req.pData && req.pData.place_name == oSendToInsert.oUpdate.place_name){//same place came to update
                                updateNow = false;
                            }
                            if(oSendToInsert.oUpdate && updateNow){
                                oSendToInsert.oUpdate.location = [req.query.lon,req.query.lat];
                                postalService.insertPostalAddr(oSendToInsert.oUpdate,cb);
                            }
                            resData.display_name = oAddress2.formatted_address;
                            resData.status ="OK";
                            return resData;
                        }else{
                            resData.display_name = oAddress2.formatted_address;
                            resData.status ="OK";
                            return resData;
                        }
                    })
                }
            });
        }else{
            fetchAddrFromG = true;
            addressService.getAddressGlobal(req.query.lat,req.query.lon,function (err,oAddress2) {
                if (err) {
                    let oErr = {status:"ERROR",message:err.toString()};
                    return oErr;
                }
                if(oAddress2 && oAddress2.addressServer && oAddress2.formatted_address && oAddress2.address_components){
                    let oSendToInsert = postalService.prepareForInsert(oAddress2);
                    let updateNow = true;
                    if(req.pData && req.pData.place_name == oSendToInsert.oUpdate.place_name){//same place came to update
                        updateNow = false;
                    }
                    if(oSendToInsert.oUpdate && updateNow){
                        oSendToInsert.oUpdate.location = [req.query.lon,req.query.lat];
                        postalService.insertPostalAddr(oSendToInsert.oUpdate,cb);
                    }
                    resData.display_name = oAddress2.formatted_address;
                    resData.status ="OK";
                    return resData;
                }else{
                    resData.display_name = oAddress2.formatted_address;
                    resData.status ="OK";
                    return resData;
                }
            })
        }
    } catch (err) {
        let oErr = {status:"ERROR",message:err.toString()};
        return oErr;
    }
}


function removeFilers(address){
    //remove fillers
    address = address.replace('Unnamed Road,','');
    address = address.replace('Unnamed Road','');
    address = address.replace('unnamed road,','');
    address = address.replace('unnamed road','');
    address = address.replace('unnamed','');
}


