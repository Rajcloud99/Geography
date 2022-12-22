/* Created By kamal
29/02/2020
//db.customlandmarks.createIndex({coordinates:"2dsphere"});
set custome index on collection before release on prod
//db.customlandmarks.getIndexes()
* * */

let router = require('express').Router();
let alertService = require('../services/alertService');
let ReportExelService = require('../services/reportExelService');
const parentDetailService = require('../services/parentDetailService');
const geocodeService = require('../services/geocodeService');
const Alerts = require('../models/alerts');

const ALLOWED_FILTER = ['_id', 'driver', 'from', 'to', 'reg_no', 'code', 'imei', 'driver','user_id','regVeh'];

function constructFilter(oQuery) {
    let oFilter = {};
    for (let i in oQuery) {
        if (otherUtil.isAllowedFilter(i, ALLOWED_FILTER)) {
            if (i === 'from') {
                let startDate = new Date(oQuery[i]);
                oFilter[oQuery.dateType || 'datetime'] = oFilter[oQuery.dateType || 'datetime'] || {};
                oFilter[oQuery.dateType || 'datetime'].$gte = startDate;

            } else if (i === 'to') {
                let endDate = new Date(oQuery[i]);
                oFilter[oQuery.dateType || 'datetime'] = oFilter[oQuery.dateType || 'datetime'] || {};
                oFilter[oQuery.dateType || 'datetime'].$lte = endDate;
            } else if (i === 'code' && Array.isArray(oQuery[i])) {
                oFilter[i] = {
                    $in: oQuery[i]
                };
            } else if (i === 'imei') {
                oFilter[i] = {
                    $in: oQuery[i]
                };
                // oFilter[i] = Number(oQuery[i]);
            } else if (i === 'driver') {
                oFilter[i] = {$regex: oQuery[i], $options: 'i'};
            }else if (i == 'regVeh' && Array.isArray(oQuery[i])) {
                let aRegVeh = [];
                for(let r=0;r<oQuery[i].length;r++){
                    aRegVeh.push(oQuery[i][r].reg_no);
                }
                if(aRegVeh.length){
                    oFilter['reg_no'] = {$in: aRegVeh};
                }
            } else {
                oFilter[i] = oQuery[i];
            }
        }
    }
    return oFilter;
};

router.post('/add', async function (req, res) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    if (!req.body.code || !req.body.imei) {
        resp.message = 'Mandatory field is missing';
        return res.json(resp);
    }
    //fetch address if not found
    if (req.body.location && !req.body.location.address && req.body.location.lat && req.body.location.lng) {
        let request = {query: {lat: req.body.location.lat, lng: req.body.location.lng}};
        let oAddr = await geocodeService.getAddressV2(request);
        if (oAddr && oAddr.status == 'OK' && oAddr.display_name) {
            req.body.location.address = oAddr.display_name;
        }
    }

    if (req.body.rfid) {
        let foundMapping = await parentDetailService.get({rfid: req.body.rfid});
        if (!(foundMapping && foundMapping[0])) {
            return res.status(203).json({
                status: 'ERROR',
                message: "No Student Found"
            });
        } else if (foundMapping.length > 1) {
            return res.status(203).json({
                status: 'ERROR',
                message: "Multiple mapping with same RFID Found"
            });
        }
        req.body.driver = foundMapping[0].student;
        if (foundMapping[0].parent1 && foundMapping[0].parent1.mobile) {
            sMsg = foundMapping[0].student + "swiped card at " + req.body.location.address;
            smsUtil.sendSMS(foundMapping[0].parent1.mobile, sMsg);
        }
    }
    resp = await alertService.createAlerts(req.body);
    return res.json(resp);
});

router.post('/upsert', async function (req, res) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    if (!req.body.code || !req.body.imei) {
        resp.message = 'Mandatory field is missing';
        return res.json(resp);
    }
    //fetch address if not found
    if (req.body.location && !req.body.location.address && req.body.location.lat && req.body.location.lng) {
        let request = {query: {lat: req.body.location.lat, lng: req.body.location.lng}};
        let oAddr = await geocodeService.getAddressV2(request);
        if (oAddr && oAddr.status == 'OK' && oAddr.display_name) {
            req.body.location.address = oAddr.display_name;
        }
    }
  try{
      resp = await alertService.upsertAlerts(req.body);
      return res.json(resp);
  }catch (e) {
      resp.message = e.message;
      console.error("alert upsert ",resp.message);
      return res.json(resp);
  }

});

router.post('/get', async function (req, res) {
    let resp = {
        status: 'ERROR',
        message: ""
    };
    resp = await alertService.getAlerts(req.body);
    if (resp && resp.data) {
        resp.data.forEach(obj => {
            if (obj.code === 'over_speed') {
                obj.code = 'Overspeed Alert';
            } else if (obj.code === 'sos') {
                obj.code = 'Panic Alert';
            } else if (obj.code === 'bettery_reconnect') {
                obj.code = 'Power Connect';
            } else if (obj.code === 'wire_disconnect') {
                obj.code = 'Wire Disconnect';
            } else if (obj.code === 'power_cut') {
                obj.code = 'Power cut';
            } else if (obj.code === 'engine_on') {
                obj.code = 'Engine On';
            } else if (obj.code === 'engine_off') {
                obj.code = 'Engine off';
            } else if (obj.code === 'tempering') {
                obj.code = 'Tempering';
            } else if (obj.code === 'emergency') {
                obj.code = 'Emergency';
            } else if (obj.code === 'low_internal_battery') {
                obj.code = 'Low Battery';
            } else if (obj.code === 'rfid') {
                obj.code = 'Driver Tag Swiped';
            } else if (obj.code === 'hb') {
                obj.code = 'Harsh Break';
            } else if (obj.code === 'ha') {
                obj.code = 'Rapid Acceleration';
            } else if (obj.code === 'rt') {
                obj.code = 'Harsh Cornering';
            } else if (obj.code === 'halt') {
                obj.code = 'Halt Alert';
            } else if (obj.code === 'nd') {
                obj.code = 'Night Drive';
            } else if (obj.code === 'fw') {
                obj.code = 'Free Wheeling';
            } else if (obj.code === 'cd') {
                obj.code = 'Continuous Driving';
            } else if (obj.code === 'idle') {
                obj.code = 'Excessive Idle';
            }
        });
    }
    if (req.body.download) {
        ReportExelService.alertReportData(Object.values(resp.data), req.body.from, req.body.to, '10808', function (d) {
            return res.status(200).json({
                status: 'SUCCESS',
                message: 'Alert report generated',
                url: d.url,
            });
        });
    } else {
        return res.json(resp);
    }

});

router.post('/getV2', async function (req, res, next) {

    try {

        // if (!req.body.from || !req.body.to) {
        //     return res.status(500).json({
        //         status: 'OK',
        //         message: 'Please provide from date and to date'
        //     });
        // }
        let oMatch = Object.assign(req.body);
        let doc = req.body.no_of_docs || 20;
        let skip = (req.body.skip -1 ) || 0;
        let sort = (req.body.sort) || {_id: -1};
        skip = skip*doc;
        var oPFil = constructFilter(oMatch);
        const aggrQuery = [
            {$match: oPFil},
            {$sort: sort},
            {$skip: skip},
            {$limit: doc},

            {
                $project: {
                    "imei": 1,
                    "reg_no": 1,
                    "datetime": 1,
                    "code": 1,
                    "driver": 1,
                    "extra": 1,
                    "location": 1,
                    "duration": 1,
                    "start":1,
                    "diff":1
                }
            },
            // {$sort: {"datetime": 1}},

        ];

        const aggrData = await Alerts
            .aggregate(aggrQuery)
            .allowDiskUse(true);

        if (aggrData) {
            aggrData.forEach(obj => {
                if (obj.code === 'over_speed') {
                    obj.code = 'Overspeed Alert';
                }if (obj.code === 'Overspeeding') {
                    obj.code = 'Overspeed Alert';
                } else if (obj.code === 'sos') {
                    obj.code = 'Panic Alert';
                } else if (obj.code === 'bettery_reconnect') {
                    obj.code = 'Power Connect';
                } else if (obj.code === 'wire_disconnect') {
                    obj.code = 'Wire Disconnect';
                } else if (obj.code === 'power_cut') {
                    obj.code = 'Power cut';
                } else if (obj.code === 'engine_on') {
                    obj.code = 'Engine On';
                } else if (obj.code === 'engine_off') {
                    obj.code = 'Engine off';
                } else if (obj.code === 'tempering') {
                    obj.code = 'Tempering';
                } else if (obj.code === 'emergency') {
                    obj.code = 'Emergency';
                } else if (obj.code === 'low_internal_battery') {
                    obj.code = 'Low Battery';
                } else if (obj.code === 'rfid') {
                    obj.code = 'Driver Tag Swiped';
                } else if (obj.code === 'hb') {
                    obj.code = 'Harsh Break';
                } else if (obj.code === 'ha') {
                    obj.code = 'Rapid Acceleration';
                } else if (obj.code === 'rt') {
                    obj.code = 'Harsh Cornering';
                } else if (obj.code === 'halt') {
                    obj.code = 'Halt Alert';
                } else if (obj.code === 'nd') {
                    obj.code = 'Night Drive';
                } else if (obj.code === 'fw') {
                    obj.code = 'Free Wheeling';
                } else if (obj.code === 'cd') {
                    obj.code = 'Continuous Driving';
                } else if (obj.code === 'idle') {
                    obj.code = 'Excessive Idle';
                }else if (obj.code === 'idl') {
                    obj.code = 'Excessive Idle';
                }else if (obj.code === 'tl') {
                    obj.code = 'Tilt';
                }else if (obj.code === 'refill') {
                    obj.code = 'Fuel Refill';
                }else if (obj.code === 'drain') {
                    obj.code = 'Fuel Drain';
                }else if (obj.code === 'entry') {
                    obj.code = 'Geo Entry';
                }else if (obj.code === 'exit') {
                    obj.code = 'Geo Exit';
                }
            });
        }
        if (req.body.download) {
            ReportExelService.alertReportData(Object.values(aggrData), req.body.from, req.body.to, '10808', function (d) {
                return res.status(200).json({
                    status: 'SUCCESS',
                    message: 'Alert report generated',
                    url: d.url,
                });
            });
        } else {
            return res.json(aggrData);
        }
    }catch (e) {
        next(e);
    }

});

router.post('/getAlerts', async (req, res, next) => {
    try {
        if (!req.body.from || !req.body.to) {
            return res.status(500).json({
                status: 'OK',
                message: 'Please provide from date and to date'
            });
        }
        let oMatch = Object.assign(req.body);
        var oPFil = constructFilter(oMatch);
        const aggrQuery = [
            {$match: oPFil},
            {$sort: {_id: -1}},

            {
                $project: {
                    "imei": 1,
                    "reg_no": 1,
                    "datetime": 1,
                    "code": 1,
                    "driver": 1,
                    "extra": 1,
                    "location": 1,
                    "duration": 1,
                    "start":1,
                    "diff":1
                }
            },
            {$sort: {"datetime": 1}},
            {
                "$group": {
                    "_id": {
                        "reg_no": "$reg_no",
                        "code": "$code",
                        "yearMonthDayUTC": {$dateToString: {format: "%d-%m-%Y", date: "$datetime"}},
                    },
                    "count": {$sum: 1},
                    "imei": {$first: '$imei'},
                    "reg_no": {$first: '$reg_no'},
                    "datetime": {$first: '$datetime'},
                    "driver": {$first: '$driver'},
                    "extra": {$first: '$extra'},
                    "data": {
                        "$push": {
                            date: "$datetime",
                            location: "$location",
                            code: "$code",
                            duration: "$duration",
                            extra: "$extra",
                            limit: "$limit"
                        }
                    },

                }
            },
            {
                $project: {
                    "_id": 1,
                    "yearMonthDayUTC": "$_id.yearMonthDayUTC",
                    "count": "$count",
                    "imei": 1,
                    "reg_no": 1,
                    "driver": 1,
                    "extra": 1,
                    "data": 1,
                    "start":1,
                    "diff":1
                }
            },
            {$sort: {"yearMonthDayUTC": 1}},
            {$sort: {"reg_no": 1}},


        ];

        const aggrData = await Alerts
            .aggregate(aggrQuery)
            .allowDiskUse(true);
        let mergeData = {};
        let allEvent = [];
        let data;

        aggrData.forEach(obj => {
            if (obj._id && obj._id.code === 'over_speed') {
                obj._id.code = 'Overspeed Alert';
                obj.eventType = 'value and Limit';
                if (data = allEvent.find(o => o.event === obj._id.code)) {
                    data.count += obj.count;
                } else {
                    allEvent.push({event: obj._id.code, count: obj.count})
                }
            } else if (obj._id && obj._id.code === 'sos') {
                obj._id.code = 'Panic Alert';
                obj.eventType = 'Moment';
                if (data = allEvent.find(o => o.event === obj._id.code)) {
                    data.count += obj.count;
                } else {
                    allEvent.push({event: obj._id.code, count: obj.count})
                }
            } else if (obj._id && obj._id.code === 'bettery_reconnect') {
                obj._id.code = 'Power Connect';
                obj.eventType = 'Moment';
                if (data = allEvent.find(o => o.event === obj._id.code)) {
                    data.count += obj.count;
                } else {
                    allEvent.push({event: obj._id.code, count: obj.count})
                }
            } else if (obj._id && obj._id.code === 'wire_disconnect') {
                obj._id.code = 'Wire Disconnect';
                obj.eventType = 'Moment';
                if (data = allEvent.find(o => o.event === obj._id.code)) {
                    data.count += obj.count;
                } else {
                    allEvent.push({event: obj._id.code, count: obj.count})
                }
            } else if (obj._id && obj._id.code === 'power_cut') {
                obj._id.code = 'Power cut';
                obj.eventType = 'Moment';
                if (data = allEvent.find(o => o.event === obj._id.code)) {
                    data.count += obj.count;
                } else {
                    allEvent.push({event: obj._id.code, count: obj.count})
                }
            } else if (obj._id && obj._id.code === 'engine_on') {
                obj._id.code = 'Engine On';
                obj.eventType = 'Moment';
                if (data = allEvent.find(o => o.event === obj._id.code)) {
                    data.count += obj.count;
                } else {
                    allEvent.push({event: obj._id.code, count: obj.count})
                }
            } else if (obj._id && obj._id.code === 'engine_off') {
                obj._id.code = 'Engine off';
                obj.eventType = 'Moment';
                if (data = allEvent.find(o => o.event === obj._id.code)) {
                    data.count += obj.count;
                } else {
                    allEvent.push({event: obj._id.code, count: obj.count})
                }
            } else if (obj._id && obj._id.code === 'tempering') {
                obj._id.code = 'Tempering';
                obj.eventType = 'Moment';
                if (data = allEvent.find(o => o.event === obj._id.code)) {
                    data.count += obj.count;
                } else {
                    allEvent.push({event: obj._id.code, count: obj.count})
                }
            } else if (obj._id && obj._id.code === 'emergency') {
                obj._id.code = 'Emergency';
                obj.eventType = 'Moment';
                if (data = allEvent.find(o => o.event === obj._id.code)) {
                    data.count += obj.count;
                } else {
                    allEvent.push({event: obj._id.code, count: obj.count})
                }
            } else if (obj._id && obj._id.code === 'low_internal_battery') {
                obj._id.code = 'Low Battery';
                obj.eventType = 'Moment';
                if (data = allEvent.find(o => o.event === obj._id.code)) {
                    data.count += obj.count;
                } else {
                    allEvent.push({event: obj._id.code, count: obj.count})
                }
            } else if (obj._id && obj._id.code === 'rfid') {
                obj._id.code = 'Driver Tag Swiped';
                obj.eventType = 'Moment';
                if (data = allEvent.find(o => o.event === obj._id.code)) {
                    data.count += obj.count;
                } else {
                    allEvent.push({event: obj._id.code, count: obj.count})
                }
            } else if (obj._id && obj._id.code === 'hb') {
                obj._id.code = 'Harsh Break';
                obj.eventType = 'Value extra';
                if (data = allEvent.find(o => o.event === obj._id.code)) {
                    data.count += obj.count;
                } else {
                    allEvent.push({event: obj._id.code, count: obj.count})
                }
            } else if (obj._id && obj._id.code === 'ha') {
                obj._id.code = 'Rapid Acceleration';
                obj.eventType = 'Value extra';
                if (data = allEvent.find(o => o.event === obj._id.code)) {
                    data.count += obj.count;
                } else {
                    allEvent.push({event: obj._id.code, count: obj.count})
                }
            } else if (obj._id && obj._id.code === 'rt') {
                obj._id.code = 'Harsh Cornering';
                obj.eventType = 'Value extra';
                if (data = allEvent.find(o => o.event === obj._id.code)) {
                    data.count += obj.count;
                } else {
                    allEvent.push({event: obj._id.code, count: obj.count})
                }
            } else if (obj._id && obj._id.code === 'halt') {
                obj._id.code = 'Halt Alert';
                obj.eventType = 'Duration';
                if (data = allEvent.find(o => o.event === obj._id.code)) {
                    data.count += obj.count;
                } else {
                    allEvent.push({event: obj._id.code, count: obj.count})
                }
            } else if (obj._id && obj._id.code === 'nd') {
                obj._id.code = 'Night Drive';
                obj.eventType = 'Duration';
                if (data = allEvent.find(o => o.event === obj._id.code)) {
                    data.count += obj.count;
                } else {
                    allEvent.push({event: obj._id.code, count: obj.count})
                }
            } else if (obj._id && obj._id.code === 'fw') {
                obj._id.code = 'Free Wheeling';
                obj.eventType = 'Duration';
                if (data = allEvent.find(o => o.event === obj._id.code)) {
                    data.count += obj.count;
                } else {
                    allEvent.push({event: obj._id.code, count: obj.count})
                }
            } else if (obj._id && obj._id.code === 'cd') {
                obj._id.code = 'Continous Driving';
                obj.eventType = 'Duration';
                if (data = allEvent.find(o => o.event === obj._id.code)) {
                    data.count += obj.count;
                } else {
                    allEvent.push({event: obj._id.code, count: obj.count})
                }
            } else if (obj._id && obj._id.code === 'idle') {
                obj._id.code = 'Excessive Idle';
                obj.eventType = 'Duration';
                if (data = allEvent.find(o => o.event === obj._id.code)) {
                    data.count += obj.count;
                } else {
                    allEvent.push({event: obj._id.code, count: obj.count})
                }
            } else {
                obj.eventType = 'Moment';
                if (data = allEvent.find(o => o.event === obj._id.code)) {
                    data.count += obj.count;
                } else {
                    allEvent.push({event: obj._id.code, count: obj.count})
                }
            }
        });

        if (aggrData) {
            if (req.body.download) {
                ReportExelService.alertReport(Object.values(aggrData), req.body, allEvent, function (d) {
                    return res.status(200).json({
                        status: 'SUCCESS',
                        message: 'Alert report generated',
                        url: d.url,
                    });
                });
            } else {
                return res.status(200).json({
                    status: 'ok',
                    message: 'Data Found',
                    data: aggrData,
                });
            }
        } else {
            return res.status(200).json({
                status: 'ok',
                message: 'no Data Found',
                data: aggrData,
            });
        }


    } catch (err) {
        next(err);
    }

});

router.post('/groupAlerts', async (req, res, next) => {
    try {
        // if(!req.body.user_id){
        //     return res.status(500).json({
        //         status: 'ERROR',
        //         message: 'User Id required'
        //     });
        // }

        if (!req.body.from || !req.body.to) {
            return res.status(500).json({
                status: 'ERROR',
                message: 'Please provide from date and to date'
            });
        }

        const aggrQuery = [
            {$match: constructFilter(req.body)},
            {$sort: {_id: -1}},

            {
                $project: {
                    "reg_no": 1,
                    "datetime": 1,
                    "code": 1
                }
            },
            {$sort: {"datetime": -1}},
        ];
        let groupKey = {$dateToString: {format: "%m-%Y", date: "$datetime"}};

        switch (req.body.groupBy) {
            case 'day':
                groupKey = {$dateToString: {format: "%d-%m-%Y", date: "$datetime"}};
            case 'month':
                aggrQuery.push(
                    {
                        $addFields: {
                            "datetime": {"$add": ["$datetime", 19800000]},
                        }
                    },
                    {
                        "$group": {
                            "_id": {
                                "code": "$code",
                                "date": groupKey,
                            },
                            "count": {$sum: 1}
                        }
                    },
                    {
                        "$group": {
                            "_id": {
                                "date": "$_id.date",
                            },
                            "date": {$first: "$_id.date"},
                            "aCode": {
                                $push: {
                                    "code": "$_id.code",
                                    "count": "$count"
                                }
                            }
                        }
                    }, {
                        $project: {
                            _id: 0
                        }
                    });
                break;
            case 'exception':
            default:
                aggrQuery.push(
                    {
                        "$group": {
                            "_id": {
                                "code": "$code",
                            },
                            "code": {$first: "$code"},
                            "count": {$sum: 1}
                        }
                    },
                    {
                        $project: {
                            _id: 0
                        }
                    });
        }

        const aggrData = await Alerts
            .aggregate(aggrQuery)
            .allowDiskUse(true);
        return res.status(200).json({
            status: 'ok',
            message: 'Data Found',
            data: aggrData,
        });

    } catch (err) {
        next(err);
    }

});

router.post('/vehicleExceptionsRpt', async (req, res, next) => {
    try {

        if (!req.body.from || !req.body.to) {
            return res.status(500).json({
                status: 'ERROR',
                message: 'Please provide from date and to date'
            });
        }

        const aggrQuery = [
            {$match: constructFilter(req.body)},
            {$sort: {_id: -1}},

            {
                $project: {
                    "reg_no": 1,
                    "datetime": 1,
                    "code": 1
                }
            },
            {$sort: {"datetime": -1}},
            {
                "$group": {
                    "_id": {
                        "code": "$code",
                        "vehicle": "$reg_no",
                    },
                    "count": {$sum: 1}
                }
            },
            {
                "$group": {
                    "_id": {
                        "vehicle": "$_id.vehicle",
                    },
                    "aCode": {
                        $push: {
                            "code": "$_id.code",
                            "count": "$count",
                        }
                    }
                }
            }, {
                $project: {
                    vehicle: "$_id.vehicle",
                    aCode: 1,
                    _id: 0
                }
            }
        ];


        const aggrData = await Alerts
            .aggregate(aggrQuery)
            .allowDiskUse(true);

        if (req.body.download) {
            ReportExelService.vehicleExceptionsReport(aggrData, req.body.from, req.body.to, '10808', function (d) {
                return res.status(200).json({
                    status: 'SUCCESS',
                    message: 'Alert report generated',
                    url: d.url,
                });
            });
        }else {
            return res.status(200).json({
                status: 'ok',
                message: 'Data Found',
                data: aggrData,
            });
        }

    } catch (err) {
        next(err);
    }

});

router.post("/action_alerts", async function (req, res, next) {
    let request = req.body;
    if (request.imei instanceof Array) {
        request.imei = request.imei.filter(s => !!s);
    } else {
        return res.status(200).json({
            message: 'No Data Found'
        });
    }

    let fdData = await alertService.getAlertsAction(req.body);

    if (req.body.download) {
        ReportExelService.alertActionReportData(fdData.data, req.body.from, req.body.to, '10808', function (d) {
            return res.status(200).json({
                status: 'SUCCESS',
                message: 'Alert Action report generated',
                url: d.url,
            });
        });
    } else {
        return res.status(200).json({
            status: 'SUCCESS',
            message: 'Alert Action Found',
            data: fdData.data,
        });
    }
});

router.post("/day_wise_tag", async function (req, res, next) {
    let request = req.body;
    if (request.imei instanceof Array) {
        request.imei = request.imei.filter(s => !!s);
    } else {
        return res.status(200).json({
            message: 'No Data Found'
        });
    }

    if (request.rfid instanceof Array) {
        request.rfid = request.rfid.filter(s => !!s);
    }

    let fdData = await alertService.getDayWiseTagAction(req.body);

    ReportExelService.dayWiseTagReportData(fdData.data, req.body.from, req.body.to, '10808', function (d) {
        return res.status(200).json({
            status: 'SUCCESS',
            message: 'Alert Action report generated',
            url: d.url,
        });
    });
});

router.post("/currentLoc", async function (req, res, next) {
    let request = req.body;

    console.log(req.body);

    return res.status(200).json({
        message: 'got location'
    });
});

module.exports = router;
