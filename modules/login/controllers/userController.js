const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const mongoose = require('mongoose');

router.post('/get', async (req, res) => {
    try {
        let oUser = await userService.findUserAggr(req.body);
        return res.status(200).json({
            'status': 'OK',
            'message': 'user found',
            'data': oUser
        });
    } catch (e) {
        return res.status(200).json({
            'status': 'ERROR',
            'message': e.message || e.toString()
        });
    }
});

router.patch('/update/:user_id', async (req, res) => {
    if (!req.params.user_id) {
        return res.status(200).json({
            'status': 'ERROR',
            'message': 'Mandatory Fields are required'
        });
    }
    try {
        let aUser = await userService.findUserAggr({_id: mongoose.Types.ObjectId(req.params.user_id)});
        if (aUser && aUser.length) {
            req.body.modifiedAt = new Date();
            req.body.modifiedBy = req.body.user_name;
            if (Object.keys(req.body).length) {

                delete req.body.password;
                delete req.body.clientId;
                delete req.body.userId;

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

router.delete('/remove/:user_id', async (req, res) => {
    if (!req.params.user_id) {
        return res.status(200).json({
            'status': 'ERROR',
            'message': 'Mandatory Fields are required'
        });
    }
    try {
        let aUser = await userService.findUserAggr({
            _id: mongoose.Types.ObjectId(req.params.user_id),
            deleted: false
        });
        if (aUser && aUser.length) {
            req.body.modifiedAt = new Date();
            req.body.modifiedBy = req.body.user_name;
            if (Object.keys(req.body).length) {

                delete req.body.password;
                delete req.body.clientId;
                delete req.body.userId;

                let oUser = await userService.updateUser({_id: mongoose.Types.ObjectId(req.params.user_id)}, {
                    set: {
                        deleted: true
                    }
                });

                return res.status(200).json({
                    'status': 'OK',
                    'message': 'User Deleted succesfully',
                    'data': oUser
                });
            } else {
                return res.status(200).json({
                    'status': 'ERROR',
                    'message': 'User Not Found',
                });
            }

        } else {
            return res.status(200).json({
                'status': 'ERROR',
                'message': 'User Not Found',
            });
        }
        return res.status(200).json({
            'status': 'ERROR',
            'message': 'User Deleted Successfully',
        });
    } catch (e) {
        return res.status(200).json({
            'status': 'ERROR',
            'message': e.message || e.toString()
        });
    }
});

module.exports = router;
