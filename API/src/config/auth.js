const pool = require('./database');
const UserRepository = require('../models/UserRepository');
const PasswordService = require('../services/PasswordService');
const SessionStore = require('../services/SessionStore');
const EmailService = require('../services/EmailService');
const AuthService = require('../services/AuthService');
const AuthController = require('../controllers/AuthController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');

function createAuth(database = pool, sessions = new SessionStore(), emailService = new EmailService()) {
    const users = new UserRepository(database);
    const passwords = new PasswordService();
    return {
        controller: new AuthController(new AuthService(users, passwords, sessions, emailService)),
        middleware: new AuthMiddleware(users, sessions)
    };
}

module.exports = { createAuth, ...createAuth() };
