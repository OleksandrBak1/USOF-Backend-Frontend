const { validateId } = require('../validators/common');
const { validateCategory } = require('../validators/categories');

class CategoryController {
    constructor(categories) {
        this.categories = categories;
        for (const action of ['list', 'get', 'create', 'update', 'delete']) this[action] = this[action].bind(this);
    }

    async list(req, res) {
        res.json(await this.categories.list());
    }

    async get(req, res) {
        res.json(await this.categories.get(validateId(req.params.category_id)));
    }

    async create(req, res) {
        const category = await this.categories.create(validateCategory(req.body));
        res.location(`/api/categories/${category.id}`).status(201).json(category);
    }

    async update(req, res) {
        const id = validateId(req.params.category_id);
        res.json(await this.categories.update(id, validateCategory(req.body, { partial: true })));
    }

    async delete(req, res) {
        await this.categories.delete(validateId(req.params.category_id));
        res.status(204).end();
    }
}

module.exports = CategoryController;
