const mysql = require('mysql2/promise');
const DatabaseSeeder = require('../services/DatabaseSeeder');

async function seedDatabase() {
    let connection;
    try {
        const config = require('../config/env');
        connection = await mysql.createConnection({
            host: config.db.host,
            port: config.db.port,
            user: config.db.user,
            password: config.db.password,
            database: config.db.name,
            charset: 'utf8mb4',
            timezone: 'Z'
        });
        await connection.query("SET time_zone = '+00:00'");
        const counts = await new DatabaseSeeder(connection).run();
        console.log('Test fixtures ensured; existing rows and administrator credentials were not updated.');
        for (const [table, count] of Object.entries(counts)) console.log(`${table}: ${count} fixtures`);
    } catch (error) {
        console.error('Database seed failed:', error.message || error);
        process.exitCode = 1;
    } finally {
        if (connection) await connection.end();
    }
}

if (require.main === module) seedDatabase();

module.exports = seedDatabase;
