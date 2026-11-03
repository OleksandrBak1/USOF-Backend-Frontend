const nodemailer = require('nodemailer');

class EmailService {
    constructor(options = {}) {
        this.appUrl = options.appUrl || process.env.APP_URL || 'http://localhost:3000';
        this.from = options.from || process.env.EMAIL_FROM || 'no-reply@usof.local';
        this.mode = options.mode || process.env.NODE_ENV || 'development';
        this.sentEmails = [];

        if (options.transporter) {
            this.transporter = options.transporter;
        } else if (process.env.SMTP_HOST) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        } else {
            // In dev / test without SMTP, use a JSON / mock stream transporter
            this.transporter = nodemailer.createTransport({
                jsonTransport: true
            });
        }
    }

    async sendVerificationEmail(email, token) {
        const verifyUrl = `${this.appUrl}/api/auth/verify-email/${encodeURIComponent(token)}`;
        const message = {
            from: this.from,
            to: email,
            subject: 'USOF - Email Verification',
            text: `Welcome to USOF!\n\nTo verify your email address, please visit the following link:\n${verifyUrl}\n\nIf you did not register for this account, please ignore this email.`,
            html: `<p>Welcome to <b>USOF</b>!</p><p>To verify your email address, please visit the following link:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
        };

        const info = await this.transporter.sendMail(message);
        this.sentEmails.push({ ...message, token, info });
        if (!process.env.SMTP_HOST || this.mode === 'development') {
            console.log(`\n[EmailService] Verification link for ${email}:\n${verifyUrl}\n`);
        }
        return info;
    }

    async sendPasswordResetEmail(email, token) {
        const clientUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        const resetUrl = `${clientUrl}/password-reset/${encodeURIComponent(token)}`;
        const message = {
            from: this.from,
            to: email,
            subject: 'USOF - Password Reset',
            text: `You requested a password reset for your USOF account.\n\nReset token: ${token}\n\nReset link:\n${resetUrl}\n\nThis token will expire in 1 hour. If you did not request this, please ignore this email.`,
            html: `<p>You requested a password reset for your <b>USOF</b> account.</p><p>Token: <code>${token}</code></p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This token will expire in 1 hour.</p>`
        };

        const info = await this.transporter.sendMail(message);
        this.sentEmails.push({ ...message, token, info });
        if (!process.env.SMTP_HOST || this.mode === 'development') {
            console.log(`\n[EmailService] Password reset link for ${email}:\n${resetUrl}\n`);
        }
        return info;
    }

    async sendMail(message) {
        return await this.transporter.sendMail({ from: this.from, ...message });
    }
}

module.exports = EmailService;
