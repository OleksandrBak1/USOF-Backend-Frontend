const HttpError = require('../errors/HttpError');
const { validateObject, validateId, validateText } = require('./common');

function validateCategories(categories) {
    if (!Array.isArray(categories) || categories.length === 0) {
        throw new HttpError(400, 'categories must be a non-empty array of category IDs');
    }
    return [...new Set(categories.map(cat => {
        const id = Number(cat);
        if (!Number.isInteger(id) || id < 1) {
            throw new HttpError(400, 'categories must contain valid positive integer IDs');
        }
        return id;
    }))];
}

function validatePostCreate(input) {
    validateObject(input, ['title', 'content', 'categories']);
    const title = validateText(input.title, 'title', 255);
    const content = typeof input.content === 'string' && input.content.trim()
        ? input.content.trim()
        : null;

    if (!content) {
        throw new HttpError(400, 'content must contain non-empty text');
    }

    const categories = validateCategories(input.categories);

    return { title, content, categories };
}

function validatePostUpdate(input, { isAuthor, isAdmin }) {
    validateObject(input, ['title', 'content', 'categories', 'status']);
    const changes = {};

    if (Object.hasOwn(input, 'status')) {
        if (!isAdmin) {
            throw new HttpError(403, 'Only admins can change post status');
        }
        if (input.status !== 'active' && input.status !== 'inactive') {
            throw new HttpError(400, 'status must be active or inactive');
        }
        changes.status = input.status;
    }

    if (Object.hasOwn(input, 'content')) {
        if (!isAuthor && isAdmin) {
            throw new HttpError(403, 'Admins cannot edit post content');
        }
        if (!isAuthor) {
            throw new HttpError(403, 'You do not have permission to edit this post content');
        }
        changes.content = validateText(input.content, 'content', 65535);
    }

    if (Object.hasOwn(input, 'title')) {
        if (!isAuthor) {
            throw new HttpError(403, 'Only the author can change the post title');
        }
        changes.title = validateText(input.title, 'title', 255);
    }

    if (Object.hasOwn(input, 'categories')) {
        if (!isAuthor && !isAdmin) {
            throw new HttpError(403, 'You do not have permission to edit categories of this post');
        }
        changes.categories = validateCategories(input.categories);
    }

    return changes;
}

function validatePostQuery(query = {}) {
    const page = query.page !== undefined ? Number(query.page) : 1;
    if (!Number.isInteger(page) || page < 1) {
        throw new HttpError(400, 'page must be an integer >= 1');
    }

    const limit = query.limit !== undefined ? Number(query.limit) : 10;
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
        throw new HttpError(400, 'limit must be an integer between 1 and 50');
    }

    const orderBy = query.order_by || 'likes';
    if (!['likes', 'date', 'publish_date'].includes(orderBy)) {
        throw new HttpError(400, 'order_by must be likes or date');
    }

    const order = (query.order || 'desc').toLowerCase();
    if (!['asc', 'desc'].includes(order)) {
        throw new HttpError(400, 'order must be asc or desc');
    }

    let categoryId = null;
    let categoryIds = null;
    if (query.category_id !== undefined && query.category_id !== '') {
        const val = String(query.category_id).trim();
        if (val.includes(',')) {
            categoryIds = val.split(',').map((part) => validateId(part.trim()));
            categoryId = categoryIds[0] || null;
        } else {
            categoryId = validateId(val);
            categoryIds = [categoryId];
        }
    }
    const authorId = query.author_id !== undefined ? validateId(String(query.author_id)) : null;

    let status = null;
    if (query.status !== undefined) {
        if (!['active', 'inactive'].includes(query.status)) {
            throw new HttpError(400, 'status must be active or inactive');
        }
        status = query.status;
    }

    return {
        page,
        limit,
        orderBy: orderBy === 'date' ? 'publish_date' : orderBy,
        order,
        categoryId,
        categoryIds,
        authorId,
        status,
        dateFrom: query.date_from || null,
        dateTo: query.date_to || null
    };
}

module.exports = {
    validatePostCreate,
    validatePostUpdate,
    validatePostQuery
};
