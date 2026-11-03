const HttpError = require('../errors/HttpError');
const { validateId } = require('../validators/common');
const {
    validatePostCreate,
    validatePostUpdate,
    validatePostQuery
} = require('../validators/posts');

class PostController {
    constructor(postService) {
        this.posts = postService;
        for (const action of ['list', 'get', 'create', 'update', 'delete', 'getCategories', 'listByCategory', 'uploadPicture']) {
            this[action] = this[action].bind(this);
        }
    }

    async list(req, res) {
        const query = validatePostQuery(req.query);
        const result = await this.posts.list(query, req.user);
        res.json(result);
    }

    async get(req, res) {
        const id = validateId(req.params.post_id);
        const result = await this.posts.get(id, req.user);
        res.json(result);
    }

    async create(req, res) {
        const data = validatePostCreate(req.body);
        const post = await this.posts.create(data, req.user.id);
        res.status(201).location(`/api/posts/${post.id}`).json(post);
    }

    async update(req, res) {
        const id = validateId(req.params.post_id);
        const post = await this.posts.get(id, req.user);
        const isAuthor = req.user && req.user.id === post.author_id;
        const isAdmin = req.user && req.user.role === 'admin';

        const changes = validatePostUpdate(req.body, { isAuthor, isAdmin });
        const updated = await this.posts.update(id, changes, req.user);
        res.json(updated);
    }

    async delete(req, res) {
        const id = validateId(req.params.post_id);
        await this.posts.delete(id, req.user);
        res.status(204).end();
    }

    async getCategories(req, res) {
        const id = validateId(req.params.post_id);
        const categories = await this.posts.getCategories(id);
        res.json(categories);
    }

    async listByCategory(req, res) {
        const categoryId = validateId(req.params.category_id);
        const query = validatePostQuery(req.query);
        const result = await this.posts.listByCategory(categoryId, query, req.user);
        res.json(result);
    }

    async uploadPicture(req, res) {
        const id = validateId(req.params.post_id);
        if (!req.file) {
            throw new HttpError(400, 'Picture file is required');
        }
        const pictureUrl = `/uploads/posts/${req.file.filename}`;
        const updated = await this.posts.updatePicture(id, pictureUrl, req.user);
        res.json(updated);
    }
}

module.exports = PostController;
