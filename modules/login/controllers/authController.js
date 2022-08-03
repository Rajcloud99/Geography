const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const authUtils = require('../utils/authUtils');
const mongoose = require('mongoose');

router.post('/login', async function (req, res, next) {
    if (!req.headers.authorization) {
        return res.status(403).json({
            'status': 'ERROR',
            'message': 'Authorization Token not found'
        });
    }
    try {
        let decoded = authUtils.authenticateLoginToken(req.headers.authorization);
        if (decoded) {
            req.user = decoded;
            return next();
        } else {
            throw new Error('Invalid Authorization Token');
        }
    } catch (e) {
        return res.status(200).json({
            'status': 'ERROR',
            'message': e.message || e.toString()
        });
    }
});

module.exports = router;
