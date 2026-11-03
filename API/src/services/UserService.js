const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const HttpError = require('../errors/HttpError');
const { UPLOADS_DIR } = require('../middlewares/upload');

class UserService {
    constructor(users, passwords, emailService = null) {
        this.users = users;
        this.passwords = passwords;
        this.emailService = emailService;
    }

    list() {
        return this.users.findAllProfiles();
    }

    async get(id, requester = null) {
        const fullUser = await this.users.findProfileById(id);
        if (!fullUser) throw new HttpError(404, 'User not found');

        const isPrivileged = requester && (requester.role === 'admin' || requester.id === id);
        if (isPrivileged) {
            return fullUser;
        }

        const publicUser = await this.users.findPublicProfileById(id);
        return publicUser;
    }

    async create(data) {
        const passwordHash = await this.passwords.hash(data.password);
        try {
            const id = await this.users.createUser({
                login: data.login, email: data.email, fullName: data.full_name, passwordHash, role: data.role
            });
            return await this.users.findProfileById(id);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Login already exists');
            throw error;
        }
    }

    async update(id, changes, requester = null) {
        const existing = await this.users.findProfileById(id);
        if (!existing) throw new HttpError(404, 'User not found');

        if (requester && requester.role !== 'admin' && requester.id !== id) {
            throw new HttpError(403, 'You do not have permission to update this profile');
        }

        const profileChanges = { ...changes };
        if (profileChanges.password) {
            if (requester && requester.role !== 'admin' && profileChanges.old_password) {
                const creds = this.users.findCredentialsById
                    ? await this.users.findCredentialsById(id)
                    : (this.users.rows ? this.users.rows.find(r => r.id === id) : await this.users.findById(id));
                const currentHash = creds?.password_hash;
                if (currentHash) {
                    const valid = await this.passwords.verify(profileChanges.old_password, currentHash);
                    if (!valid) {
                        throw new HttpError(400, 'Current password is incorrect');
                    }
                }
            }
            delete profileChanges.old_password;
            profileChanges.password_hash = await this.passwords.hash(profileChanges.password);
            delete profileChanges.password;
        } else {
            delete profileChanges.old_password;
        }

        const emailChanged = profileChanges.email && profileChanges.email.toLowerCase() !== existing.email.toLowerCase();

        try {
            await this.users.updateProfile(id, profileChanges);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Login already exists');
            throw error;
        }

        if (emailChanged && requester && requester.role !== 'admin') {
            const token = randomBytes(32).toString('hex');
            await this.users.setEmailVerificationToken(id, token);
            if (this.emailService) {
                try {
                    await this.emailService.sendVerificationEmail(changes.email, token);
                } catch (err) {
                    console.error('Failed to send verification email:', err);
                }
            }
        }

        return this.get(id, requester);
    }

    async updateAvatar(userId, file) {
        if (!file) throw new HttpError(400, 'Avatar image file is required');

        const existing = await this.users.findProfileById(userId);
        if (!existing) throw new HttpError(404, 'User not found');

        if (existing.profile_picture && !existing.profile_picture.includes('default-avatar.png')) {
            const oldFilename = path.basename(existing.profile_picture);
            const oldFilePath = path.join(UPLOADS_DIR, oldFilename);
            if (fs.existsSync(oldFilePath)) {
                try {
                    fs.unlinkSync(oldFilePath);
                } catch (_) {
                }
            }
        }

        const avatarRelativePath = `/uploads/avatars/${file.filename}`;
        await this.users.updateAvatar(userId, avatarRelativePath);

        return this.get(userId, { id: userId, role: existing.role });
    }

    async delete(id) {
        try {
            if (!await this.users.deleteUser(id)) throw new HttpError(404, 'User not found');
        } catch (error) {
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                throw new HttpError(409, 'User has posts or comments; resolve their ownership or deletion before deleting the user');
            }
            throw error;
        }
    }
}

module.exports = UserService;
