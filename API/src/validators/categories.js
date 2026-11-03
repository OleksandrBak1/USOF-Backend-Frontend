const HttpError = require('../errors/HttpError');
const { validateObject, validateText } = require('./common');

function validateCategory(input, { partial = false } = {}) {
    validateObject(input, ['title', 'description']);
    const category = {};
    if (!partial || Object.hasOwn(input, 'title')) {
        category.title = validateText(input.title, 'title', 100);
    }
    if (Object.hasOwn(input, 'description')) {
        if (typeof input.description !== 'string' || Buffer.byteLength(input.description, 'utf8') > 65535) {
            throw new HttpError(400, 'description must be a string of at most 65535 UTF-8 bytes');
        }
        category.description = input.description;
    } else if (!partial) {
        category.description = '';
    }
    return category;
}

module.exports = { validateCategory };
