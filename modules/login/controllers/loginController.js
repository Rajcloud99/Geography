const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const authUtils = require('../utils/authUtils');
const mongoose = require('mongoose');

router.post('', async function (req, res, next) {
    try {
        if (!req.body.userId || !req.body.password) {
            throw new Error('Mandatory Fields are required');
        }

        let foundUser = await userService.findUserAggr(req.body, {
            _id: 1,
            clientId: 1,
            userId: 1,
            name: 1,
            mobile: 1,
            role: 1,
            access: 1
        });

        if (Array.isArray(foundUser) && foundUser.length) {
            foundUser = foundUser[0];
            let authToken = authUtils.generateAuthToken(foundUser);
            return res.status(200).json({
                'status': 'OK',
                'message': 'User Successfully Logged In',
                'token': authToken,
                "user": foundUser,
                // "client_config": req.clientData.clients[0],
                // "access": req.access,
                // "tableAccess": req.tableAcc,
                // "configs": req.configs,
                // "role_data": req.allowedResources
            });
        } else {
            throw new Error('Invalid Username or Password')
        }

    } catch (e) {
        return res.status(400).send({
            status: "ERROR",
            message: e.toString()
        });
    }
});

router.post('/create', async (req, res) => {
    try {

        let foundUser = await userService.findUserAggr({
            userId: req.body.userId
        }, {
            _id: 1
        });

        if(Array.isArray(foundUser) && foundUser.length)
            throw new Error('UserId is already taken');

        foundUser = await userService.findUserAggr({
            no_of_docs: 1,
            sort: {_id: -1}
        }, {
            clientId: 1,
        });

        if(Array.isArray(foundUser) && foundUser.length) {
            req.body.clientId = foundUser[0].clientId+1;
        }else
            req.body.clientId = 2000;

        let oUser = await userService.regUser(req.body);

        foundUser = await userService.findUserAggr({_id: oUser._id}, {
            _id: 1,
            clientId: 1,
            userId: 1,
            name: 1,
            mobile: 1,
            role: 1,
            access: 1
        });
        foundUser = foundUser[0];
        let authToken = authUtils.generateAuthToken(foundUser);

        return res.status(200).json({
            'status': 'OK',
            'message': 'user Created',
            'token': authToken,
            "user": foundUser,
        });
    } catch (e) {
        return res.status(200).json({
            'status': 'ERROR',
            'message': e.message || e.toString()
        });
    }
});

module.exports = router;
