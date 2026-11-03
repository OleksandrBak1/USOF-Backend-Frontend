const { validateLogin } = require('../validators/auth');
const HttpError = require('../errors/HttpError');

class AdminBootstrapService {
    constructor(users, passwords) {
        this.users = users;
        this.passwords = passwords;
    }

    async create(settings) {
        const { login, email, password } = validateLogin(settings);
        const fullName = settings.fullName?.trim();
        if (!fullName || fullName.length > 100) {
            throw new HttpError(400, 'ADMIN_FULL_NAME must contain 1 to 100 characters');
        }
        if (settings.emailVerified !== true) {
            throw new HttpError(400, 'Verify ownership of ADMIN_EMAIL independently, then set ADMIN_EMAIL_VERIFIED=true');
        }
        if (password.length < 12) {
            throw new HttpError(400, 'ADMIN_PASSWORD must contain at least 12 characters');
        }

        const existing = await this.checkExisting(login, email);
        if (existing) return existing;

        const passwordHash = await this.passwords.hash(password);
        try {
            const id = await this.users.createAdmin({ login, email, fullName, passwordHash });
            return { created: true, id };
        } catch (err) {
            if (err.code !== 'ER_DUP_ENTRY') throw err;
            const concurrent = await this.checkExisting(login, email);
            if (concurrent) return concurrent;
            throw new HttpError(409, 'An account conflicts with the initial administrator; no account was changed');
        }
    }

    async checkExisting(login, email) {
        const conflicts = await this.users.findBootstrapConflicts(login, email);
        if (conflicts.length === 0) return null;
        if (conflicts.length === 1 && conflicts[0].same_login && conflicts[0].same_email &&
            conflicts[0].role === 'admin') {
            return { created: false, id: conflicts[0].id };
        }
        throw new HttpError(409, 'Login or email already belongs to an account; no account was changed');
    }
}

module.exports = AdminBootstrapService;
