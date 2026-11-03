const HttpError = require('../errors/HttpError');

class AuthMiddleware {
    constructor(users, sessions) {
        this.users = users;
        this.sessions = sessions;
        this.requireAuth = this.requireAuth.bind(this);
        this.requireAdmin = this.requireAdmin.bind(this);
        this.optionalAuth = this.optionalAuth.bind(this);
    }

    async optionalAuth(req, res, next) {
        const authHeader = req.get('Authorization') || '';
        const match = /^Bearer ([a-f0-9]{64})$/i.exec(authHeader);
        if (match) {
            const userId = this.sessions.getUserId(match[1]);
            if (userId) {
                const user = await this.users.findById(userId);
                if (user && (user.email_verified === 1 || user.email_verified === true)) {
                    req.user = user;
                    req.authToken = match[1];
                }
            }
        }
        next();
    }

    async requireAuth(req, res, next) {
        const match = /^Bearer ([a-f0-9]{64})$/i.exec(req.get('Authorization') || '');
        const userId = match ? this.sessions.getUserId(match[1]) : null;
        if (!userId) throw new HttpError(401, 'Authentication required');

        const user = await this.users.findById(userId);
        if (!user) throw new HttpError(401, 'Authentication required');
        if (user.email_verified !== 1 && user.email_verified !== true) {
            throw new HttpError(403, 'Email must be confirmed before signing in');
        }
        req.user = user;
        req.authToken = match[1];
        next();
    }

    async requireAdmin(req, res, next) {
        await this.requireAuth(req, res, () => {});
        if (req.user.role !== 'admin') throw new HttpError(403, 'Admin access required');
        next();
    }
}

module.exports = AuthMiddleware;
