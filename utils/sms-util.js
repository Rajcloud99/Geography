/**
 * Initial version by: Kamal Mewada
 * Initial version created on: 02/02/2020
 */
const request = require('request');

if(config.sms && config.sms.authKey){
	var oSMS = {
		url: config.sms.url,
		authKey: config.sms.authKey,
		sender: config.sms.sender,
		mobile: 9535888738,
		message: 'OTP for user registration is OTP : ',
		route: 4,
		unicode: 1,
		response: 'json',
		country: 91
	};
}

module.exports.generateOtp = function() {
	var newOtp = Math.floor(Math.random() * 9000) + 1000;
	return newOtp;
};

module.exports.sendSMS = function(mobile, message, cb = () => {}) {
	oSMS.mobile = mobile;
	oSMS.message = message;
	smsUrl = oSMS.url + "authkey=" + oSMS.authKey + "&sender=" + oSMS.sender + "&route=" + oSMS.route + "&unicode=" + oSMS.unicode + "&country=" + oSMS.country + "&response=" + oSMS.response + "&mobiles=" + oSMS.mobile + "&message=" + oSMS.message;
	console.log(smsUrl);
	if (config.sms) {
		request(smsUrl, function (error, response, body) {
			if (!error && (response.statusCode < 400)) {
				console.log("SMS " + body, response.statusCode);
				return cb(null, body);
			} else {
				console.error("failed SMS ", error);
				return cb(error, null);
			}
		});
	}
	return 1;
};
//module.exports.sendSMS(9535888748,'hi test sms');
