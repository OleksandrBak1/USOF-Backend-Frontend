const PROFILE_COLUMNS = 'id, login, full_name, email, profile_picture, rating, role, email_verified';
const PUBLIC_PROFILE_COLUMNS = 'id, login, full_name, profile_picture, rating, role, created_at';

class UserRepository {
    constructor(database) {
        this.database = database;
    }

    async findForLogin(login, email) {
        const [rows] = await this.database.execute(
            'SELECT id, login, email, full_name, role, email_verified, password_hash FROM users WHERE login = ? AND email = ? LIMIT 1',
            [login, email]
        );
        return rows[0] || null;
    }

    async findCredentialsById(id) {
        const [rows] = await this.database.execute(
            'SELECT id, password_hash, role FROM users WHERE id = ? LIMIT 1',
            [id]
        );
        return rows[0] || null;
    }

    async findById(id) {
        const [rows] = await this.database.execute(
            'SELECT id, login, email, full_name, role, email_verified FROM users WHERE id = ? LIMIT 1',
            [id]
        );
        return rows[0] || null;
    }

    async findBootstrapConflicts(login, email) {
        const [rows] = await this.database.execute(
            'SELECT id, role, (login = ?) AS same_login, (email = ?) AS same_email FROM users WHERE login = ? OR email = ?',
            [login, email, login, email]
        );
        return rows;
    }

    async createAdmin({ login, email, fullName, passwordHash }) {
        const [result] = await this.database.execute(
            'INSERT INTO users (login, email, full_name, password_hash, role, email_verified) VALUES (?, ?, ?, ?, ?, ?)',
            [login, email, fullName, passwordHash, 'admin', true]
        );
        return result.insertId;
    }

    async findAllProfiles() {
        const [rows] = await this.database.execute(`SELECT ${PROFILE_COLUMNS} FROM users ORDER BY id`);
        return rows;
    }

    async findProfileById(id) {
        const [rows] = await this.database.execute(`SELECT ${PROFILE_COLUMNS} FROM users WHERE id = ?`, [id]);
        return rows[0] || null;
    }

    async findPublicProfileById(id) {
        const [rows] = await this.database.execute(`SELECT ${PUBLIC_PROFILE_COLUMNS} FROM users WHERE id = ?`, [id]);
        return rows[0] || null;
    }

    async updateAvatar(id, avatarPath) {
        await this.database.execute('UPDATE users SET profile_picture = ? WHERE id = ?', [avatarPath, id]);
    }

    async setEmailVerificationToken(id, token) {
        await this.database.execute('UPDATE users SET email_verified = FALSE, email_verification_token = ? WHERE id = ?', [token, id]);
    }

    async createUser({ login, email, fullName, passwordHash, role }) {
        const [result] = await this.database.execute(
            `INSERT INTO users (login, email, full_name, password_hash, role, email_verified)
             VALUES (?, ?, ?, ?, ?, FALSE)`,
            [login, email, fullName, passwordHash, role]
        );
        return result.insertId;
    }

    async updateProfile(id, changes) {
        const assignments = [];
        const values = [];
        if (Object.hasOwn(changes, 'email')) {
            assignments.push('email_verified = IF(CAST(email AS BINARY) = CAST(? AS BINARY), email_verified, FALSE)');
            values.push(changes.email);
        }
        for (const field of ['login', 'full_name', 'email', 'role', 'password_hash']) {
            if (Object.hasOwn(changes, field)) {
                assignments.push(`${field} = ?`);
                values.push(changes[field]);
            }
        }
        if (!assignments.length) throw new Error('No profile fields to update');
        await this.database.execute(`UPDATE users SET ${assignments.join(', ')} WHERE id = ?`, [...values, id]);
    }

    async findByEmail(email) {
        const [rows] = await this.database.execute(
            'SELECT id, login, email, full_name, role, email_verified FROM users WHERE email = ? LIMIT 1',
            [email]
        );
        return rows[0] || null;
    }

    async findByLogin(login) {
        const [rows] = await this.database.execute(
            'SELECT id, login, email, full_name, role, email_verified FROM users WHERE login = ? LIMIT 1',
            [login]
        );
        return rows[0] || null;
    }

    async findByEmailVerificationToken(token) {
        const [rows] = await this.database.execute(
            'SELECT id, login, email, full_name, role, email_verified FROM users WHERE email_verification_token = ? LIMIT 1',
            [token]
        );
        return rows[0] || null;
    }

    async verifyEmail(id) {
        const [result] = await this.database.execute(
            'UPDATE users SET email_verified = TRUE, email_verification_token = NULL WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    async setPasswordResetToken(id, token, expiresAt) {
        await this.database.execute(
            'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
            [token, expiresAt, id]
        );
    }

    async findByPasswordResetToken(token) {
        const [rows] = await this.database.execute(
            'SELECT id, login, email, password_reset_expires FROM users WHERE password_reset_token = ? LIMIT 1',
            [token]
        );
        return rows[0] || null;
    }

    async updatePasswordAndClearResetToken(id, passwordHash) {
        const [result] = await this.database.execute(
            'UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
            [passwordHash, id]
        );
        return result.affectedRows > 0;
    }

    async registerUser({ login, email, fullName, passwordHash, verificationToken }) {
        const [result] = await this.database.execute(
            `INSERT INTO users (login, email, full_name, password_hash, role, email_verified, email_verification_token)
             VALUES (?, ?, ?, ?, 'user', FALSE, ?)`,
            [login, email, fullName, passwordHash, verificationToken]
        );
        return result.insertId;
    }

    async deleteUser(id) {
        const [result] = await this.database.execute('DELETE FROM users WHERE id = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = UserRepository;
