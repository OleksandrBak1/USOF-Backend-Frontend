const HttpError = require('../errors/HttpError');
const { validateObject, validateText, validateEmail } = require('./common');
const { validateLogin } = require('./auth');

const UPDATE_FIELDS = ['login', 'full_name', 'email', 'role', 'password', 'password_confirmation', 'old_password', 'current_password'];

function validateRole(role) {
    if (role !== 'user' && role !== 'admin') throw new HttpError(400, 'role must be user or admin');
    return role;
}

function validateUserCreate(input) {
    validateObject(input, [...UPDATE_FIELDS]);
    const credentials = validateLogin(input);
    if (credentials.password.length < 12) throw new HttpError(400, 'password must contain at least 12 characters');
    if (typeof input.password_confirmation !== 'string' || input.password_confirmation !== credentials.password) {
        throw new HttpError(400, 'password_confirmation must match password');
    }
    return {
        ...credentials,
        full_name: validateText(input.full_name, 'full_name', 100),
        role: validateRole(input.role)
    };
}

function validateUserUpdate(input, isAdmin = false) {
    validateObject(input, UPDATE_FIELDS);
    const changes = {};
    if (Object.hasOwn(input, 'login')) changes.login = validateText(input.login, 'login', 50);
    if (Object.hasOwn(input, 'full_name')) changes.full_name = validateText(input.full_name, 'full_name', 100);
    if (Object.hasOwn(input, 'email')) changes.email = validateEmail(input.email);
    if (Object.hasOwn(input, 'role')) {
        if (!isAdmin) {
            throw new HttpError(403, 'Only admin can change user role');
        }
        changes.role = validateRole(input.role);
    }
    if (Object.hasOwn(input, 'password')) {
        if (typeof input.password !== 'string' || input.password.length < 6) {
            throw new HttpError(400, 'password must contain at least 6 characters');
        }
        if (Object.hasOwn(input, 'password_confirmation')) {
            if (input.password !== input.password_confirmation) {
                throw new HttpError(400, 'password_confirmation must match password');
            }
        }
        changes.password = input.password;
    }
    if (Object.hasOwn(input, 'old_password')) {
        if (typeof input.old_password !== 'string' || input.old_password.length === 0) {
            throw new HttpError(400, 'old_password must be a non-empty string');
        }
        changes.old_password = input.old_password;
    }
    if (Object.hasOwn(input, 'current_password')) {
        if (typeof input.current_password !== 'string' || input.current_password.length === 0) {
            throw new HttpError(400, 'current_password must be a non-empty string');
        }
        changes.old_password = input.current_password;
    }
    return changes;
}

module.exports = { validateUserCreate, validateUserUpdate };
