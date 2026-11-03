const AdminBootstrapService = require('../services/AdminBootstrapService');
const UserRepository = require('../models/UserRepository');
const PasswordService = require('../services/PasswordService');
const HttpError = require('../errors/HttpError');

async function createAdmin() {
    let pool;
    try {
        const config = require('../config/env');
        pool = require('../config/database');
        const bootstrap = new AdminBootstrapService(new UserRepository(pool), new PasswordService());
        const result = await bootstrap.create(config.admin);
        console.log(result.created ? 'Initial administrator created.' : 'Administrator already exists; no data changed.');
    } catch (err) {
        console.error(err instanceof HttpError ? err.message :
            'Administrator creation failed. Check local .env settings, MySQL access and run npm run db:init.');
        process.exitCode = 1;
    } finally {
        if (pool) await pool.end();
    }
}

if (require.main === module) createAdmin();

module.exports = createAdmin;
