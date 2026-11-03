const {
    validateLogin,
    validateRegister,
    validatePasswordResetRequest,
    validatePasswordResetConfirm
} = require('../validators/auth');

class AuthController {
    constructor(authService) {
        this.authService = authService;
        this.login = this.login.bind(this);
        this.logout = this.logout.bind(this);
        this.register = this.register.bind(this);
        this.verifyEmail = this.verifyEmail.bind(this);
        this.requestPasswordReset = this.requestPasswordReset.bind(this);
        this.confirmPasswordReset = this.confirmPasswordReset.bind(this);
    }

    async register(req, res) {
        const input = validateRegister(req.body);
        const result = await this.authService.register(input);
        res.set('Cache-Control', 'no-store');
        res.status(201).json(result);
    }

    async verifyEmail(req, res) {
        const { token } = req.params;
        const result = await this.authService.verifyEmail(token);
        res.set('Cache-Control', 'no-store');
        res.status(200).json(result);
    }

    async requestPasswordReset(req, res) {
        const { email } = validatePasswordResetRequest(req.body);
        const result = await this.authService.requestPasswordReset(email);
        res.set('Cache-Control', 'no-store');
        res.status(200).json(result);
    }

    async confirmPasswordReset(req, res) {
        const token = req.params.confirm_token || req.params.token;
        const { password } = validatePasswordResetConfirm(req.body);
        const result = await this.authService.confirmPasswordReset(token, password);
        res.set('Cache-Control', 'no-store');
        res.status(200).json(result);
    }

    async login(req, res) {
        const credentials = validateLogin(req.body);
        const result = await this.authService.login(credentials);
        res.set('Cache-Control', 'no-store');
        res.status(200).json(result);
    }

    logout(req, res) {
        this.authService.logout(req.authToken);
        res.set('Cache-Control', 'no-store');
        res.status(204).end();
    }
}

module.exports = AuthController;
