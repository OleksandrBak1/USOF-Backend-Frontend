const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');

const deriveKey = promisify(scrypt);
const OPTIONS = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const PREFIX = 'scrypt$32768$8$3';

class PasswordService {
    async hash(password) {
        const salt = randomBytes(16).toString('hex');
        const key = await deriveKey(password, salt, 64, OPTIONS);
        return `${PREFIX}$${salt}$${key.toString('hex')}`;
    }

    async verify(password, encoded) {
        const valid = typeof encoded === 'string' &&
            /^scrypt\$32768\$8\$3\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(encoded);
        const parts = valid ? encoded.split('$') : [];
        const salt = valid ? parts[4] : '0'.repeat(32);
        const expected = valid ? Buffer.from(parts[5], 'hex') : Buffer.alloc(64);
        const actual = await deriveKey(password, salt, 64, OPTIONS);
        return timingSafeEqual(actual, expected) && valid;
    }
}

module.exports = PasswordService;
