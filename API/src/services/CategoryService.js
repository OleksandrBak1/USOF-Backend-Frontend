const HttpError = require('../errors/HttpError');

class CategoryService {
    constructor(categories) {
        this.categories = categories;
    }

    list() {
        return this.categories.findAll();
    }

    async get(id) {
        const category = await this.categories.findById(id);
        if (!category) throw new HttpError(404, 'Category not found');
        return category;
    }

    async create(data) {
        try {
            const id = await this.categories.create(data);
            return await this.get(id);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Category title already exists');
            throw error;
        }
    }

    async update(id, changes) {
        await this.get(id);
        try {
            await this.categories.update(id, changes);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Category title already exists');
            throw error;
        }
        return this.get(id);
    }

    async delete(id) {
        if (!await this.categories.delete(id)) throw new HttpError(404, 'Category not found');
    }
}

module.exports = CategoryService;
