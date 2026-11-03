const { validateId } = require('../validators/common');
const { validateUserCreate, validateUserUpdate } = require('../validators/users');

class UserController {
    constructor(users) {
        this.users = users;
        for (const action of ['list', 'get', 'create', 'update', 'delete', 'uploadAvatar']) this[action] = this[action].bind(this);
    }

    async list(req, res) {
        res.json(await this.users.list());
    }

    async get(req, res) {
        res.json(await this.users.get(validateId(req.params.user_id), req.user));
    }

    async create(req, res) {
        const user = await this.users.create(validateUserCreate(req.body));
        res.location(`/api/users/${user.id}`).status(201).json(user);
    }

    async update(req, res) {
        const id = validateId(req.params.user_id);
        const isAdmin = req.user && req.user.role === 'admin';
        const changes = validateUserUpdate(req.body, isAdmin);
        res.json(await this.users.update(id, changes, req.user));
    }

    async uploadAvatar(req, res) {
        const user = await this.users.updateAvatar(req.user.id, req.file);
        res.json(user);
    }

    async delete(req, res) {
        await this.users.delete(validateId(req.params.user_id));
        res.status(204).end();
    }
}

module.exports = UserController;
