const mysql = require('mysql2/promise');
const config = require('../config/env');
const { initializeSchema } = require('../database/schema');
const DatabaseSeeder = require('../services/DatabaseSeeder');
const UserRepository = require('../models/UserRepository');
const PasswordService = require('../services/PasswordService');
const AdminBootstrapService = require('../services/AdminBootstrapService');

async function resetDatabase() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: config.db.host,
            port: config.db.port,
            user: config.db.user,
            password: config.db.password,
            charset: 'utf8mb4'
        });

        const dbName = mysql.escapeId(config.db.name);
        console.log(`Dropping old database ${config.db.name} if exists...`);
        await connection.query(`DROP DATABASE IF EXISTS ${dbName}`);
        await connection.query(`CREATE DATABASE ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await connection.query(`USE ${dbName}`);
        await connection.query("SET time_zone = '+00:00'");

        console.log('Creating fresh tables...');
        await initializeSchema(connection);

        console.log('Seeding fixtures...');
        const counts = await new DatabaseSeeder(connection).run();
        console.log('Success! Clean database created and seeded:');
        for (const [table, count] of Object.entries(counts)) {
            console.log(`  - ${table}: ${count} records`);
        }

        console.log('Bootstrapping administrator...');
        const bootstrap = new AdminBootstrapService(new UserRepository(connection), new PasswordService());
        try {
            await bootstrap.create({
                login: config.admin.login,
                email: config.admin.email,
                fullName: config.admin.fullName,
                password: config.admin.password,
                emailVerified: true
            });
            console.log(`Admin ready: login="${config.admin.login}", email="${config.admin.email}"`);
        } catch (adminErr) {
            console.log('Admin note:', adminErr.message);
        }
    } catch (err) {
        console.error('Reset failed:', err.message || err);
        process.exitCode = 1;
    } finally {
        if (connection) await connection.end();
    }
}

if (require.main === module) resetDatabase();

module.exports = resetDatabase;
