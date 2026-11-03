const mysql = require('mysql2/promise');
const config = require('../config/env');
const { initializeSchema } = require('../database/schema');
const { standardCategories } = require('../database/seedData');
const UserRepository = require('../models/UserRepository');
const PasswordService = require('../services/PasswordService');
const AdminBootstrapService = require('../services/AdminBootstrapService');

/**
 * Creates a completely clean database:
 * - Drops and re-creates tables.
 * - Seeds only base categories (JavaScript, React, etc.).
 * - Leaves 0 test users, 0 posts, 0 comments.
 * - Bootstraps the administrator account from .env so you can log in and test everything yourself manually.
 */
async function cleanDatabase() {
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
        console.log(`Resetting database ${config.db.name} to blank state...`);
        await connection.query(`DROP DATABASE IF EXISTS ${dbName}`);
        await connection.query(`CREATE DATABASE ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await connection.query(`USE ${dbName}`);
        await connection.query("SET time_zone = '+00:00'");

        console.log('Creating fresh tables...');
        await initializeSchema(connection);

        console.log('Seeding standard categories...');
        for (const cat of standardCategories) {
            await connection.execute(
                'INSERT INTO categories (title, description) VALUES (?, ?)',
                [cat.title, cat.description]
            );
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
            console.log(`Admin ready: login="${config.admin.login}", password="${config.admin.password}"`);
        } catch (adminErr) {
            console.log('Admin note:', adminErr.message);
        }

        console.log('\nSuccess! Database is completely empty and ready for your manual creation.');
        console.log('Zero users, zero posts. Only standard categories and the admin account exist.');
    } catch (err) {
        console.error('Clean failed:', err.message || err);
        process.exitCode = 1;
    } finally {
        if (connection) await connection.end();
    }
}

if (require.main === module) cleanDatabase();

module.exports = cleanDatabase;

