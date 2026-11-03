const mysql = require('mysql2/promise');
const { initializeSchema, TABLES } = require('../database/schema');

function formatColumn(column) {
    return [
        column.Field,
        column.Type,
        `Null=${column.Null}`,
        `Key=${column.Key || '-'}`,
        `Default=${column.Default === null ? 'NULL' : column.Default}`,
        `Extra=${column.Extra || '-'}`
    ].join(' | ');
}

function getFriendlyErrorMessage(err, config) {
    if (!config) {
        return 'Check PORT and DB_PORT in your local .env.';
    }

    if (err.code === 'ECONNREFUSED') {
        return `Cannot connect to MySQL at ${config.db.host}:${config.db.port}. Check that MySQL is running and DB_HOST/DB_PORT are correct in your local .env.`;
    }

    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        return 'MySQL access denied. Check DB_USER and DB_PASSWORD in your local .env.';
    }

    if (err.code === 'ENOTFOUND') {
        return 'MySQL host was not found. Check DB_HOST in your local .env.';
    }

    if (err.code === 'ER_DBACCESS_DENIED_ERROR') {
        return `The MySQL user does not have permission to create or use database "${config.db.name}". Check DB_USER privileges.`;
    }

    if (err.code === 'UNSUPPORTED_MYSQL_VERSION') return err.message;
    return 'Check MySQL availability, schema compatibility and CREATE/REFERENCES privileges.';
}

async function createDatabase(config) {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: config.db.host,
            port: config.db.port,
            user: config.db.user,
            password: config.db.password
        });

        const databaseName = mysql.escapeId(config.db.name);

        await connection.query(
            `CREATE DATABASE IF NOT EXISTS ${databaseName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function verifyConnection(pool) {
    const [rows] = await pool.query('SELECT 1 AS connection_check');

    return rows[0].connection_check === 1;
}

async function initDatabase() {
    let config;
    let pool;

    try {
        config = require('../config/env');
        pool = require('../config/database');

        console.log(`Initializing MySQL database "${config.db.name}" at ${config.db.host}:${config.db.port}...`);

        await createDatabase(config);

        const isConnected = await verifyConnection(pool);
        console.log(`SELECT 1: ${isConnected ? 'ok' : 'failed'}`);

        await initializeSchema(pool);

        for (const table of Object.keys(TABLES)) {
            const [columns] = await pool.query(`SHOW COLUMNS FROM ${mysql.escapeId(table)}`);
            console.log(`${table} table structure:`);
            columns.forEach((column) => console.log(formatColumn(column)));
        }

        console.log('Database initialization completed.');
    } catch (err) {
        console.error('Database initialization failed.');
        console.error(getFriendlyErrorMessage(err, config));
        process.exitCode = 1;
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

if (require.main === module) initDatabase();

module.exports = { initDatabase, createDatabase };
