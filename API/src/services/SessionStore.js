const { randomBytes, createHash } = require('node:crypto');

class SessionStore {
    constructor({ ttlMs = 60 * 60 * 1000, now = Date.now } = {}) {
        this.ttlMs = ttlMs;
        this.now = now;
        this.sessions = new Map();
    }

    digest(token) {
        return createHash('sha256').update(token).digest('hex');
    }

    create(userId) {
        const now = this.now();
        for (const [key, session] of this.sessions) {
            if (session.expiresAt <= now) this.sessions.delete(key);
        }
        const token = randomBytes(32).toString('hex');
        const expiresAt = now + this.ttlMs;
        this.sessions.set(this.digest(token), { userId, expiresAt });
        return { token, expiresAt: new Date(expiresAt).toISOString() };
    }

    getUserId(token) {
        if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return null;
        const key = this.digest(token);
        const session = this.sessions.get(key);
        if (!session) return null;
        if (session.expiresAt <= this.now()) {
            this.sessions.delete(key);
            return null;
        }
        return session.userId;
    }

    revoke(token) {
        if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return false;
        return this.sessions.delete(this.digest(token));
    }
}

module.exports = SessionStore;
