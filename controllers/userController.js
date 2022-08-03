const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const clientService = require('../services/clientService');

router.put('/edit/:user_id', async (req, res) => {
    if (!req.params.user_id) {
        return res.status(200).json({
            'status': 'ERROR',
            'message': 'please send mobile no/user id'
        });
    }
    try {
        let aUser = await userService.findUserAggr({_id: mongoose.Types.ObjectId(req.params.user_id)});
        if (aUser && aUser.length) {
            req.body.modifiedAt = new Date();
            req.body.modifiedBy = req.body.user_name;
            delete req.body.password;
            delete req.body.password;
            delete req.body.clientId;
            delete req.body.mobile;
            if (Object.keys(req.body).length) {
                let oUser = await userService.updateUser({_id: mongoose.Types.ObjectId(req.params.user_id)}, req.body);
                return res.status(200).json({
                    'status': 'OK',
                    'message': 'User updated succesfully',
                    'data': oUser
                });
            } else {
                return res.status(200).json({
                    'status': 'ERROR',
                    'message': 'nothing to update',
                });
            }

        } else {
            return res.status(200).json({
                'status': 'ERROR',
                'message': 'user with mobile not exists',
            });
        }
    } catch (e) {
        return res.status(200).json({
            'status': 'ERROR',
            'message': e.message || e.toString()
        });
    }
});

router.post('/getClient', async (req, res) => {
    try {
        let oClient = await clientService.findClientAggr({clientId:req.body.toc_id});
        return res.status(200).json({
            'status': 'OK',
            'message': 'client found',
            'data': oClient && oClient[0]
        });
    } catch (e) {
        return res.status(200).json({
            'status': 'ERROR',
            'message': e.message || e.toString()
        });
    }
});

module.exports = router;
