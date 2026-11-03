const fs = require('fs');
const path = require('path');

const DEFAULT_PORT = 3000;
const DEFAULT_NODE_ENV = 'development';
const DEFAULT_DB_HOST = 'localhost';
const DEFAULT_DB_PORT = 3306;
const DEFAULT_DB_USER = 'root';
const DEFAULT_DB_PASSWORD = '';
const DEFAULT_DB_NAME = 'usof';
const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const ENV_PATH = path.join(ROOT_DIR, '.env');

function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return;
    }

    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

    lines.forEach((line) => {
        const trimmedLine = line.trim();

        if (!trimmedLine || trimmedLine.startsWith('#')) {
            return;
        }

        const separatorIndex = trimmedLine.indexOf('=');

        if (separatorIndex === -1) {
            return;
        }

        const key = trimmedLine.slice(0, separatorIndex).trim();
        let value = trimmedLine.slice(separatorIndex + 1).trim();

        if (!key || process.env[key] !== undefined) {
            return;
        }

        const isWrappedInSingleQuotes = value.startsWith("'") && value.endsWith("'");
        const isWrappedInDoubleQuotes = value.startsWith('"') && value.endsWith('"');

        if (isWrappedInSingleQuotes || isWrappedInDoubleQuotes) {
            value = value.slice(1, -1);
        }

        process.env[key] = value;
    });
}

function normalizePort(port, variableName) {
    const normalizedPort = String(port).trim();

    if (!/^\d+$/.test(normalizedPort)) {
        throw new Error(`${variableName} must be an integer from 1 to 65535.`);
    }

    const parsedPort = Number(normalizedPort);

    if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
        throw new Error(`${variableName} must be an integer from 1 to 65535.`);
    }

    return parsedPort;
}

loadEnvFile(ENV_PATH);

module.exports = {
    port: normalizePort(process.env.PORT ?? DEFAULT_PORT, 'PORT'),
    nodeEnv: process.env.NODE_ENV || DEFAULT_NODE_ENV,
    appUrl: process.env.APP_URL || `http://localhost:${process.env.PORT ?? DEFAULT_PORT}`,
    mail: {
        host: process.env.SMTP_HOST || '',
        port: process.env.SMTP_PORT ? normalizePort(process.env.SMTP_PORT, 'SMTP_PORT') : 587,
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.EMAIL_FROM || 'no-reply@usof.local'
    },
    admin: {
        login: process.env.ADMIN_LOGIN,
        email: process.env.ADMIN_EMAIL,
        fullName: process.env.ADMIN_FULL_NAME,
        password: process.env.ADMIN_PASSWORD,
        emailVerified: process.env.ADMIN_EMAIL_VERIFIED === 'true'
    },
    db: {
        host: process.env.DB_HOST || DEFAULT_DB_HOST,
        port: normalizePort(process.env.DB_PORT ?? DEFAULT_DB_PORT, 'DB_PORT'),
        user: process.env.DB_USER || DEFAULT_DB_USER,
        password: process.env.DB_PASSWORD ?? DEFAULT_DB_PASSWORD,
        name: process.env.DB_NAME || DEFAULT_DB_NAME
    }
};
