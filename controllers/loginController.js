const express = require ('express');
const router = express.Router();
const smsUtil = require('../utils/sms-utils');
const userService = require('../services/userService');
const clientService = require('../services/clientService');
const jwt = require('jsonwebtoken');
let telegram = require('../utils/telegramBotUtil');
const contactService = require('../services/contactService');
const notificationService = require('../services/notificationService');

router.post('/get_otp_token', async (req, res) => {
	if(!req.body.mobile){
		return res.status(200).json({
			'status': 'ERROR',
			'message': 'please send mobile no.'
		});
	}

    if(isNaN(req.body.mobile) || req.body.mobile.toString().length < 10 || req.body.mobile.toString().length > 13){
        return res.status(200).json({
            'status': 'ERROR',
            'message': 'mobile no is not valid'
        });
    }

    let aUsers = await userService.findUserAggr({mobile:req.body.mobile});
    if(aUsers && aUsers.length){
        return res.status(200).json({
            'status': 'ERROR',
            'message':'User already exist with mobile no'
        });
    }
    let otpPayload = {mobile:req.body.mobile,time:new Date().getTime()};
    if(config.sec && config.sec.registration){
        otpPayload.otp = smsUtil.generateOtp();
        let otpToken = jwt.sign(otpPayload, config.sec.registration,{ expiresIn: config.sec.expiresIn });
        let msg = "OTP to register in myPin "+ otpPayload.otp;
        console.log(msg);
        await telegram.sendMessage(msg);
        smsUtil.sendSMS(req.body.mobile,msg);

        return res.status(200).json({
            'status': 'OK',
            'otpToken':otpToken,
            'message':'OTP token will be expire in 1 Hr'
        });
    }else{
        console.error('put app registration sectret key');
        return res.status(200).json({
            'status': 'ERROR',
            'masg':'put app registration sectret key'
        });
    }
});

router.post('/verify_otp', async (req, res) => {
    if(!req.headers.otptoken){//header is chnaging key to small case
        return res.status(200).json({
            'status': 'ERROR',
            'message': 'please send otpToken in headers of request'
        });
    }
    if(!req.body.otp){
        return res.status(200).json({
            'status': 'ERROR',
            'message': 'please send OTP'
        });
    }
    if(config.sec && config.sec.registration){
        try{
            let decoded = jwt.verify(req.headers.otptoken, config.sec.registration);
            if(decoded && decoded.otp == req.body.otp){
                console.log('Token matched');
                let otpPayload = {otp:req.body.otp,mobile:decoded.mobile,time:new Date().getTime()};
                let registrationToken = jwt.sign(otpPayload, config.sec.registration,{ expiresIn: config.sec.expiresIn});
                return res.status(200).json({
                    'status': 'OK',
                    'message':'This matched',
                    regToken:registrationToken
                });
            }else{
                console.log('Token not matched');
                return res.status(200).json({
                    'status': 'ERROR',
                    'message':'otp token not matched'
                });
            }
        }catch (e) {
            return res.status(200).json({
                'status': 'ERROR',
                'message':e.message || e.toString()
            });
        }

    }
});

router.post('/reg_client', async (req, res) => {
    if(!req.headers.regtoken){
        return res.status(200).json({
            'status': 'ERROR',
            'message': 'please send regtoken in headers of request'
        });
    }
    if(!req.body.mobile){
        return res.status(200).json({
            'status': 'ERROR',
            'message': 'please send mobile no'
        });
    }
    if(config.sec && config.sec.registration){
        try{
            let decoded = jwt.verify(req.headers.regtoken, config.sec.registration);
            if(decoded){
                let aClient = await clientService.findClientAggr({primary_mobile:req.body.mobile});
                if(aClient && aClient.length){
                    return res.status(200).json({
                        'status': 'ERROR',
                        'message':'user with same primary mobile no already exists',
                    });
                }else{
                    req.body.primary_mobile = req.body.mobile;
                    req.body.createdAt = new Date();
                    req.body.createdBy = req.body.name;
                    let oClient = await clientService.regClient(req.body);
                    if(oClient && oClient.clientId){
                        let oUser = await userService.regUser(req.body);
                        let regPayload = {
                            clientId:req.body.clientId,
                            name:req.body.name,
                            mobile:decoded.mobile,
                            company:req.body.company_name,
                            time:new Date().getTime()
                        };
                        let loginToken = jwt.sign(regPayload, config.sec.registration,{ expiresIn: config.sec.loginExpiresIn });
                        delete oUser.password;
                        //TODO
                        let aCon = await contactService.findContactAggr({mobile:parseInt(decoded.mobile)});
                        if(aCon && aCon.length){
                            for(let c=0;c<aCon.length;c++){
                                if(aCon[c].toc_id){
                                    continue;
                                }
                                let aClient = await clientService.findClientAggr({clientId:aCon[c].clientId});
                                if(aClient && aClient[0]){
                                    aClient[0].myClientId = req.body.clientId;
                                    let oNotif  = prepareContactSuggetionNotif(aClient[0]);
                                    await notificationService.addNotification(oNotif);
                                }
                            }
                        }
                        return res.status(200).json({
                            'status': 'OK',
                            'message':'This matched',
                            'data':oUser,
                            'loginToken':loginToken
                        });
                    }else {
                        return res.status(200).json({
                            'status': 'ERROR',
                            'message':'client created but user failed.',
                            'data':oClient
                        });
                    }
                }
            }else{
                console.log('Token not matched');
                return res.status(200).json({
                    'status': 'ERROR',
                    'message':'reg token not matched'
                });
            }
        }catch (e) {
            return res.status(200).json({
                'status': 'ERROR',
                'message':e.message || e.toString()
            });
        }

    }
});

router.post('/login', async (req, res) => {
    if(!req.body.mobile){
        return res.status(200).json({
            'status': 'ERROR',
            'message': 'please send mobile no'
        });
    }
    if(!req.body.password){
        return res.status(200).json({
            'status': 'ERROR',
            'message': 'please send password no'
        });
    }
    if(config.sec && config.sec.registration){
        try{
            let aUser = await userService.findUserAggr({mobile:req.body.mobile});
            if(aUser && aUser.length){
                if(aUser[0].password == req.body.password) {
                    let aClient = await clientService.findClientAggr({primary_mobile:req.body.mobile});
                    let regPayload = {
                        clientId:aUser[0].clientId,
                        name:aUser[0].name,
                        mobile: req.body.mobile,
                        company:aClient && aClient[0] && aClient[0].company_name,
                        time: new Date().getTime()
                    };
                    aUser[0].client = aClient[0];
                    let loginToken = jwt.sign(regPayload, config.sec.registration, {expiresIn: config.sec.loginExpiresIn});
                    delete aUser[0].password;
                    return res.status(200).json({
                        'status': 'OK',
                        'message':'This matched',
                        'data':aUser[0],
                        'loginToken':loginToken
                    });
                }else{
                    return res.status(200).json({
                        'status': 'ERROR',
                        'message':'pssword does not matched',
                    });
                }
            }else{
                return res.status(200).json({
                    'status': 'ERROR',
                    'message':'User does no already exists',
                });
            }
        }catch (e) {
            return res.status(200).json({
                'status': 'ERROR',
                'message':e.message || e.toString()
            });
        }

    }
});

router.post('/get_reset_otp', async (req, res) => {
    if(!req.body.mobile){
        return res.status(200).json({
            'status': 'ERROR',
            'message': 'please send mobile no.'
        });
    }

    if(isNaN(req.body.mobile) || req.body.mobile.toString().length < 10 || req.body.mobile.toString().length > 13){
        return res.status(200).json({
            'status': 'ERROR',
            'message': 'mobile no is not valid'
        });
    }

    let aUsers = await userService.findUserAggr({mobile:req.body.mobile});
    if(aUsers && aUsers.length){
        let otpPayload = {mobile:req.body.mobile,time:new Date().getTime()};
        if(config.sec && config.sec.registration){
            otpPayload.otp = smsUtil.generateOtp();
            let otpToken = jwt.sign(otpPayload, config.sec.registration,{ expiresIn: config.sec.expiresIn });
            let msg = "OTP to reset password in TOC "+ otpPayload.otp;
            console.log(msg);
            await telegram.sendMessage(msg);

            smsUtil.sendSMS(req.body.mobile,msg);

            return res.status(200).json({
                'status': 'OK',
                'otpToken':otpToken,
                'message':'OTP token to reset password will be expire in 1 Hr'
            });
        }else{
            console.error('put app registration sectret key');
            return res.status(200).json({
                'status': 'ERROR',
                'masg':'put app registration sectret key'
            });
        }
    }else{
        return res.status(200).json({
            'status': 'ERROR',
            'message':'User not exists for given mobile no'
        });
    }

});

router.post('/reset_password', async (req, res) => {
    if(!req.headers.otptoken){
        return res.status(200).json({
            'status': 'ERROR',
            'message': 'please send otptoken in headers of request'
        });
    }
    if(!req.body.mobile){
        return res.status(200).json({
            'status': 'ERROR',
            'message': 'please send mobile no'
        });
    }
    if(!req.body.password){
        return res.status(200).json({
            'status': 'ERROR',
            'message': 'please send password'
        });
    }
    if(config.sec && config.sec.registration){
        try{
            let decoded = jwt.verify(req.headers.otptoken, config.sec.registration);
            if(decoded){
                if(req.body.mobile != decoded.mobile){
                    return res.status(200).json({
                        'status': 'ERROR',
                        'message':'mobile no not match with otp token mobile.'
                    });
                }
                if(req.body.otp != decoded.otp){
                    return res.status(200).json({
                        'status': 'ERROR',
                        'message':'otp not match with otp token mobile.'
                    });
                }
                let aUser = await userService.findUserAggr({mobile:req.body.mobile});
                if(aUser && aUser.length){
                    let oUser = {password:req.body.password};
                    let oQuery = {mobile:req.body.mobile}
                    req.body.primary_mobile = req.body.mobile;
                    req.body.clientId = Date.now();
                    oUser = await userService.updateUser(oQuery,oUser);
                    let aClient = await clientService.findClientAggr({primary_mobile:req.body.mobile});
                    let regPayload = {
                        clientId:aUser[0].clientId,
                        name:aUser[0].name,
                        mobile:req.body.mobile,
                        company:aClient && aClient[0] && aClient[0].company_name,
                        time:new Date().getTime()
                    };
                    let loginToken = jwt.sign(regPayload, config.sec.registration,{ expiresIn: config.sec.expiresIn });
                    delete oUser.password;
                    return res.status(200).json({
                        'status': 'OK',
                        'message':'Password successfully reset',
                        'data':oUser,
                        'loginToken':loginToken
                    });
                }else{
                    return res.status(200).json({
                        'status': 'ERROR',
                        'message':'user with  mobile not exists',
                    });
                }
            }else{
                return res.status(200).json({
                    'status': 'ERROR',
                    'message':'otp token not matched'
                });
            }
        }catch (e) {
            return res.status(200).json({
                'status': 'ERROR',
                'message':e.message || e.toString()
            });
        }

    }
});

router.post('/check_reg', async (req, res) => {
    if(!req.body.mobile){
        return res.status(200).json({
            'status': 'ERROR',
            'message': 'please send mobile no'
        });
    }

    let aUser = await userService.findUserAggr({mobile:req.body.mobile});

    if(!(aUser[0] && aUser[0]._id)){
        return res.status(200).json({
            'status': 'ERROR',
            'message':'User doesn\'t exist.',
        });
    }

    return res.status(200).json({
        'status': 'OK',
        'message':'user exist',
    });
});
module.exports = router;
