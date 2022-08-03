const jwt = require('jsonwebtoken');
const config = require('../config.json');

module.exports = {
    authenticateLoginToken,
    generateAuthToken,
}

function authenticateLoginToken(token){
    return jwt.verify(token, config.sec.registration);
}

function generateAuthToken(obj) {
    return jwt.sign(obj, config.sec.registration, {expiresIn: config.sec.loginExpiresIn});
}