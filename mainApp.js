const Login = require('./modules/login/login');
process.env.TZ = 'Asia/Calcutta';
global.express = require('express');
global.Promise = require('bluebird');
global.winston = require('winston');
global.mongoose = Promise.promisifyAll(require('mongoose'));
global.app = express();
global.projectHome = __dirname;
global.passport = require('passport');
global.request = require('request');
global.utils = require('./utils');
global.otherUtil = Promise.promisifyAll(require(projectHome + '/utils/other-util'));
global.commonUtil = Promise.promisifyAll(require(projectHome + '/utils/common-util'));
global.csvDownload = Promise.promisifyAll(require(projectHome + '/utils/csv-download'));
global.ENV = process.env.GEO_ENV;
if (ENV) {
	console.log("Current environment is: " + ENV);
	let commonConfig = require(projectHome + '/config/default.json');
	let envConfig = require(projectHome + '/config/' + ENV + ".json");
	global.config = utils.mergeObjects(commonConfig, envConfig);
} else {
	//console.log ("Please set your system's environment on key LMS_ENV!!!");
	//console.log ("For ubuntu command: export GEO_ENV=dev");
	global.config = require(projectHome + '/config/default.json');
}
global.smsUtil = require('./utils/sms-util');
//let httpLogger = require ('morgan') ('dev');
let httpLogger = require('morgan');
let bodyParser = require ('body-parser');
let cors = require ('cors');
let compression = require ('compression');
let cookieParser = require ('cookie-parser');
var cb = function (err,respp) {

}
global.LocalityModel = Promise.promisifyAll(require('./models/locality'));
global.PostalAreaModel = Promise.promisifyAll(require('./models/postalArea'));
global.postals = Promise.promisifyAll(require('./models/postal'));
global.runningReq = {};
const addressService = require('./services/addressService');
const postalService = require('./services/postalAdressService');

app.configureViews = function() {
	app.set('views', projectHome + '/views');
	app.set('view engine', 'hbs');
};

app.configureUtilities = function() {
	//app.use(favicon(projectHome + '/public/favicon2.ico'));
	//app.use(httpLogger);
	app.use(express.static(__dirname + '/files'));
	app.use(httpLogger(function (tokens, req, res) {
		if(runningReq[req.body.request_id]){
			//console.log('deleting request id',req.body.request_id);
			if(!tokens['response-time'](req, res) || tokens['response-time'](req, res) == 0){
				console.log([
					'prevent deleting request id',
					tokens.method(req, res),
					tokens.url(req, res),
					tokens.status(req, res),
					tokens.res(req, res, 'content-length'), '-',
					tokens['response-time'](req, res), 'ms',
					new Date().toLocaleString()
				].join(' '));
			}else{
				delete runningReq[req.body.request_id];
			}
		}
		let ip;
		if(req.connection && req.connection.remoteAddress){
			ip = req.connection.remoteAddress;
		}else if(req.socket && req.socket.remoteAddress){
			ip = req.socket.remoteAddress;
		}else{
			ip = req.headers['x-forwarded-for'];
		}
		if(tokens['response-time'](req, res) && tokens['response-time'](req, res) >  5000){
			return [
				'Taking long Time',
				tokens.method(req, res),
				tokens.url(req, res),
				tokens.status(req, res),
				tokens.res(req, res, 'content-length'), '-',
				tokens['response-time'](req, res), 'ms',
				ip,
				new Date().toLocaleString()
			].join(' ');
		}else{
			console.log([
				tokens.method(req, res),
				tokens.url(req, res),
				tokens.status(req, res),
				tokens.res(req, res, 'content-length'), '-',
				tokens['response-time'](req, res), 'ms',
				ip,
				new Date().toLocaleString()
			].join(' '));
			return;
		}
	}, {
			skip: function (req, res) {
				//console.log(res.statusCode,req.skipMe,res.skipMe);
				//return res.statusCode < 400;
			}
		}));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
		extended: false
	}));
	app.use(cookieParser());
	app.use(cors());
	app.use(compression());
};

app.setupDB = function() {
	const mongoConf = config.mongoDB;
	let Uri = "mongodb://";
	if (mongoConf.user) {
		Uri = Uri + mongoConf.user + ":" + mongoConf.password + "@"
	}
	Uri = Uri + mongoConf.host + ":" + mongoConf.port + "/" + mongoConf.db;
	mongoose.connect(Uri, { useMongoClient: true }, function(err) {
		if (err) return console.error('app.js err ' + err);
	    return console.info('Connected to MongoDB ' + Uri);
	});
};

app.configureHeaders = function() {
	app.all('*', function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		if (req.headers.origin) {
			//console.log('req.headers.origin',req.headers.origin)
			//res.header('Access-Control-Allow-Origin', req.headers.origin);
		}
		res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS ,PATCH');
		res.header('Access-Control-Allow-Credentials', true);
		res.header('Access-Control-Max-Age', '86400');
		res.header("Access-Control-Allow-Headers",
			"Origin, X-Requeted-With, Content-Type, Accept, Authorization, RBR, X-HTTP-Method-Override");
		next();
	});
};

app.configureRoutes = function() {
	let oLogin = new Login(app);
	oLogin.init(oLogin);
    app.use('/reverse', require('./controllers/geocodeController'));
	app.use('/landmark', require('./controllers/landmarkController'));
	app.use('/sensor', require('./controllers/sensorController'));
	app.use('/beat', require('./controllers/beatController'));
	app.use('/alert', require('./controllers/alertController'));
	app.use('/parentDetail', require('./controllers/parentDetailController'));
	app.use('/reverse2',function (req, res, next) {
		if(!req.query.lat || !req.query.lon){
			return res.status(500).json({status:"ERROR",message:"Latitude or longitude not found in query."});
		}
		if(req.query.lat>90 || req.query.lat<-90 || req.query.lon<-180|| req.query.req>180){
			return res.status(500).json({status:"ERROR",message:"Latitude or longitude value is non-valid"});
		}
		LocalityModel.findOneAsync({location:{$near:{$geometry: {type: "Point" ,coordinates:[req.query.lon,req.query.lat]},$maxDistance:20000}}})
			.then(function (lData) {
				lData=JSON.parse(JSON.stringify(lData));
				PostalAreaModel.findOneAsync({location:{$near:{$geometry: {type: "Point" ,coordinates:[req.query.lon,req.query.lat]},$maxDistance:20000}}})
					.then(function (pData) {
						if(pData) {
							pData = JSON.parse (JSON.stringify (pData));
							let resData = {};
							resData.lat = req.query.lat;
							resData.lon = req.query.lon;
							resData.display_name = "";
							let detail = {};
							let distanceFromlData = parseInt (getDistanceFromLatLonInKm (req.query.lat, req.query.lon, lData.location[1], lData.location[0]) * 100) / 100;
							let distanceFrompData = parseInt (getDistanceFromLatLonInKm (req.query.lat, req.query.lon, pData.location[1], pData.location[0]) * 100) / 100;
							detail.distance = distanceFromlData < distanceFrompData ? distanceFromlData : distanceFrompData;
							if (lData.asciiname && lData.asciiname !== "" && distanceFromlData - distanceFrompData < 5) {
								if (detail.distance > 3)
									resData.display_name += detail.distance + "km from ";
								resData.display_name += lData.asciiname;
								detail.locality = lData.asciiname;
							}
							if (pData["place name"] && pData["place name"] !== "") {
								detail.place = pData["place name"];
								if (detail.place != detail.locality) {
									resData.display_name = resData.display_name === "" ? "" : resData.display_name + ", ";
									resData.display_name += pData["place name"];
								}
							}
							if (pData["admin name3"] && pData["admin name3"] !== "") {
								detail.zone = pData["admin name3"];
								if (detail.zone != detail.place) {
									resData.display_name = resData.display_name === "" ? "" : resData.display_name + ", ";
									resData.display_name += pData["admin name3"];
								}
							}
							if (pData["admin name2"] && pData["admin name2"] !== "") {
								detail.city = pData["admin name2"];
								if (detail.city != detail.zone) {
									resData.display_name = resData.display_name === "" ? "" : resData.display_name + ", ";
									resData.display_name += pData["admin name2"];
								}
							}
							if (pData["admin name1"] && pData["admin name1"] !== "") {
								detail.state = pData["admin name1"];
								if (detail.state != detail.city) {
									resData.display_name = resData.display_name === "" ? "" : resData.display_name + ", ";
									resData.display_name += pData["admin name1"];
								}
							}
							if (pData["postal code"] && pData["postal code"] !== "") {
								resData.display_name = resData.display_name === "" ? "" : resData.display_name + ", ";
								detail.postal = pData["postal code"];
								resData.display_name += pData["postal code"];
							}
							if (req.query.detail === 'true') {
								resData.detail = detail;
							}
							return res.status (200).json (resData);
						}
						else {
							request.get({
								headers: {"accept-language":"en-US,en;q=0.8"},
								url:     'http://52.220.18.209/reverse?format=json&lat='+req.query.lat+'&lon='+req.query.lon+'&addressdetails=1'
							}, function(error, response, body){
								if(body) {
									body = JSON.parse(body);
									let resData = {};
									resData.lat = req.query.lat;
									resData.lon = req.query.lon;
									resData.display_name = body.display_name;
									if (req.query.detail === 'true') {
										resData.detail = body.address;
									}
									return res.status (200).json (resData);
								}
								if (error) {
									return res.status (500).json ({message:error});
								}
							});
						}
					})
					.catch(next)
			})
			.catch(next)
	});
    app.use('/reverse3',function (req, res, next) {
        if(!req.query.lat || !req.query.lon){
            return res.status(500).json({status:"ERROR",message:"Latitude or longitude not found in query."});
        }
        if(req.query.lat>90 || req.query.lat<-90 || req.query.lon<-180|| req.query.req>180){
            return res.status(500).json({status:"ERROR",message:"Latitude or longitude value is non-valid"});
        }
        LocalityModel.findOneAsync({location:{$near:{$geometry: {type: "Point" ,coordinates:[req.query.lon,req.query.lat]},$maxDistance:3000}}})
            .then(function (lData) {
                lData=JSON.parse(JSON.stringify(lData));
                postals.findOneAsync({location:{$near:{$geometry: {type: "Point" ,coordinates:[req.query.lon,req.query.lat]},$maxDistance:16000}}})
                    .then(function (pData) {
                        let detail = {};
                        let distanceFromlData,distanceFrompData;
						let resData = {};
                    	if(pData){
                            pData = JSON.parse (JSON.stringify (pData));
                            resData.lat = req.query.lat;
                            resData.lon = req.query.lon;
                            resData.display_name = "";
                            let distanceFromlData = parseInt (getDistanceFromLatLonInKm (req.query.lat, req.query.lon, lData.location[1], lData.location[0]) * 100) / 100;
                            let distanceFrompData = parseInt (getDistanceFromLatLonInKm (req.query.lat, req.query.lon, pData.location[1], pData.location[0]) * 100) / 100;
                            detail.distance = distanceFromlData < distanceFrompData ? distanceFromlData : distanceFrompData;

                        }
						if(detail && pData && detail.distance < 3) {
                            if (lData.asciiname && lData.asciiname !== "" && distanceFromlData - distanceFrompData < 5) {
                                if (detail.distance > 2)
                                    resData.display_name += detail.distance + " km from ";
                                resData.display_name += lData.asciiname;
                                detail.locality = lData.asciiname;
                            }
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
                            return res.status (200).json (resData);
                        }else {
                            addressService.getAddressFromMapMyIndia(req.query.lat,req.query.lon,function (err,oAddress) {
                                if (err) {
                                    return res.status (500).json ({message:err});
                                }
                            	if(oAddress && oAddress.addressServer && oAddress.formatted_address){
                                    let oSendToInsert = postalService.prepareForInsert(oAddress);
                                    if(oSendToInsert.oUpdate){
                                        oSendToInsert.oUpdate.location = [req.query.lon,req.query.lat];
                                        postalService.insertPostalAddr(oSendToInsert.oUpdate,cb);
                                    }
                                    let resData = {};
                                    resData.lat = req.query.lat;
                                    resData.lon = req.query.lon;
                                    resData.display_name = oAddress.formatted_address;
                                    return res.status (200).json (resData);
                                }


                            });
                            /*
                            request.get({
                                headers: {"accept-language":"en-US,en;q=0.8"},
                                url:     'http://52.220.18.209/reverse?format=json&lat='+req.query.lat+'&lon='+req.query.lon+'&addressdetails=1'
                            }, function(error, response, body){
                                if(body) {
                                    body = JSON.parse(body);
                                    let resData = {};
                                    resData.lat = req.query.lat;
                                    resData.lon = req.query.lon;
                                    resData.display_name = body.display_name;
                                    if (req.query.detail === 'true') {
                                        resData.detail = body.address;
                                    }
                                    return res.status (200).json (resData);
                                }
                                if (error) {
                                    return res.status (500).json ({message:error});
                                }
                            });
                            */
                        }
                    })
                    .catch(next)
            })
            .catch(next)
    });
	app.use('/mis', require('./controllers/misController'));
};

app.configureErorrHandlers = function() {
	//catch 404 as error
	app.use(function(req, res, next) {
		let err = new Error('Not Found');
		err.status = 404;
		next(err);
	});
	app.use(function(err, req, res, next) {
		console.error("dev env app.jsconfigureErorrHandlers", err.toString());
		res.status(err.status || 500);
		res.json({
			'status': 'ERROR',
			'message': err.toString()
		});
	});
	//}
};

app.initialize = function() {
	app.configureUtilities();
	app.setupDB();
	app.configureHeaders();
	app.configureRoutes();
	app.configureErorrHandlers();
}();

let server = app.listen(config.http_port, function() {
	console.info("listening on port : " + config.http_port);
	if (config.debug) {
		require('debug')('node-server')('Express server listening on port ' + server.display_name().port);
	}
});

if(config.downloadEnabled && config.download_port){
	require('./fileServer');
}

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
	let R = 6371; // Radius of the earth in km
	let dLat = deg2rad(lat2-lat1);  // deg2rad below
	let dLon = deg2rad(lon2-lon1);
	let a =
		Math.sin(dLat/2) * Math.sin(dLat/2) +
		Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
		Math.sin(dLon/2) * Math.sin(dLon/2)
	;
	let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	 // return Distance in km
	return R * c;
}

function deg2rad(deg) {
	return deg * (Math.PI/180)
}
