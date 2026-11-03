const { Router } = require('express');
const auth = require('../config/auth');

function createAuthRoutes(controller = auth.controller, middleware = auth.middleware) {
    const router = Router();
    router.post('/register', controller.register);
    router.get('/verify-email/:token', controller.verifyEmail);
    router.post('/login', controller.login);
    router.post('/logout', middleware.requireAuth, controller.logout);
    router.post('/password-reset', controller.requestPasswordReset);
    router.get('/password-reset/:confirm_token', (req, res) => {
        const clientUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        res.redirect(`${clientUrl}/password-reset/${encodeURIComponent(req.params.confirm_token)}`);
    });
    router.post('/password-reset/:confirm_token', controller.confirmPasswordReset);
    return router;
}

module.exports = createAuthRoutes;
