const HttpError = require('../errors/HttpError');

function validateObject(input, allowedFields) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new HttpError(400, 'A JSON object is required');
    }
    const fields = Object.keys(input);
    if (fields.length === 0) throw new HttpError(400, 'At least one field is required');
    if (fields.some(field => !allowedFields.includes(field))) {
        throw new HttpError(400, 'Request contains unsupported fields');
    }
}

function validateId(value) {
    if (typeof value !== 'string' || !/^[1-9]\d{0,9}$/.test(value) || Number(value) > 4294967295) {
        throw new HttpError(400, 'id must be an integer from 1 to 4294967295');
    }
    return Number(value);
}

function validateText(value, field, maxLength) {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
        throw new HttpError(400, `${field} must contain 1 to ${maxLength} characters`);
    }
    return value.trim();
}

function validateEmail(value) {
    if (typeof value !== 'string' || value.trim().length > 255 ||
        !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value.trim())) {
        throw new HttpError(400, 'A valid email is required');
    }
    return value.trim();
}

module.exports = { validateObject, validateId, validateText, validateEmail };
