const { randomBytes } = require('node:crypto');
const HttpError = require('../errors/HttpError');

class AuthService {
    constructor(users, passwords, sessions, emailService = null) {
        this.users = users;
        this.passwords = passwords;
        this.sessions = sessions;
        this.emailService = emailService;
    }

    async register({ login, email, password, fullName }) {
        const existingLogin = await this.users.findByLogin(login);
        if (existingLogin) {
            throw new HttpError(409, 'An account with this login already exists');
        }

        const existingEmail = await this.users.findByEmail(email);
        if (existingEmail) {
            throw new HttpError(409, 'An account with this email already exists');
        }

        const passwordHash = await this.passwords.hash(password);
        const verificationToken = randomBytes(32).toString('hex');

        const userId = await this.users.registerUser({
            login,
            email,
            fullName,
            passwordHash,
            verificationToken
        });

        if (this.emailService) {
            try {
                await this.emailService.sendVerificationEmail(email, verificationToken);
            } catch (err) {
                console.error('Failed to send verification email:', err);
            }
        }

        return {
            id: userId,
            login,
            email,
            full_name: fullName,
            message: 'Registration successful. Please verify your email before logging in.'
        };
    }

    async verifyEmail(token) {
        if (!token || typeof token !== 'string') {
            throw new HttpError(400, 'Invalid verification token');
        }

        const user = await this.users.findByEmailVerificationToken(token);
        if (!user) {
            throw new HttpError(400, 'Verification token is invalid or has already been used');
        }

        await this.users.verifyEmail(user.id);
        return { message: 'Email verified successfully. You can now log in.' };
    }

    async requestPasswordReset(email) {
        const user = await this.users.findByEmail(email);
        if (user) {
            const token = randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 3600000); // 1 hour
            await this.users.setPasswordResetToken(user.id, token, expiresAt);

            if (this.emailService) {
                try {
                    await this.emailService.sendPasswordResetEmail(email, token);
                } catch (err) {
                    console.error('Failed to send password reset email:', err);
                }
            }
        }
        return { message: 'If that email belongs to an account, a reset link has been sent.' };
    }

    async confirmPasswordReset(token, password) {
        if (!token || typeof token !== 'string') {
            throw new HttpError(400, 'Invalid reset token');
        }

        const user = await this.users.findByPasswordResetToken(token);
        if (!user) {
            throw new HttpError(400, 'Password reset token is invalid or has already been used');
        }

        if (new Date(user.password_reset_expires) < new Date()) {
            throw new HttpError(400, 'Password reset token has expired');
        }

        const passwordHash = await this.passwords.hash(password);
        await this.users.updatePasswordAndClearResetToken(user.id, passwordHash);

        return { message: 'Password has been reset successfully. You can now log in with your new password.' };
    }

    async login({ login, email, password }) {
        const user = await this.users.findForLogin(login, email);
        const passwordMatches = await this.passwords.verify(password, user?.password_hash);
        if (!user || !passwordMatches) {
            throw new HttpError(401, 'Invalid login, email or password');
        }
        if (user.email_verified !== 1 && user.email_verified !== true) {
            throw new HttpError(403, 'Email must be confirmed before signing in');
        }
        const session = this.sessions.create(user.id);
        return {
            ...session,
            tokenType: 'Bearer',
            user: {
                id: user.id,
                login: user.login,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        };
    }

    logout(token) {
        this.sessions.revoke(token);
    }
}

module.exports = AuthService;
