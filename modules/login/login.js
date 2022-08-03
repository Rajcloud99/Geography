const authUtils = require('./utils/authUtils');
const userController = require('./controllers/userController');
const loginController = require('./controllers/loginController');
const authController = require('./controllers/authController');

class Login {

    constructor(expressApp, config = {}) {
        this.expressApp = expressApp;
    }

    init() {
        this.expressApp.use('/api/login', loginController);
        this.expressApp.all('/api/*', authController);
        this.expressApp.use('/api/users', userController);
    }
}

module.exports = Login;