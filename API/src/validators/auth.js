const HttpError = require('../errors/HttpError');
const { validateEmail } = require('./common');

function validateLogin(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new HttpError(400, 'A JSON object with login, email and password is required');
    }

    const { login, email, password } = input;
    if (typeof login !== 'string' || !login.trim() || login.trim().length > 50) {
        throw new HttpError(400, 'login must contain 1 to 50 characters');
    }
    const normalizedEmail = validateEmail(email);
    if (typeof password !== 'string' || !password.length || Buffer.byteLength(password, 'utf8') > 1024) {
        throw new HttpError(400, 'password must contain 1 to 1024 bytes');
    }

    return { login: login.trim(), email: normalizedEmail, password };
}

function validateRegister(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new HttpError(400, 'A JSON object is required');
    }

    const { login, email, password, password_confirmation, passwordConfirmation, full_name, fullName } = input;
    const confirmation = password_confirmation !== undefined ? password_confirmation : passwordConfirmation;

    if (typeof login !== 'string' || !login.trim() || login.trim().length > 50) {
        throw new HttpError(400, 'login must contain 1 to 50 characters');
    }

    const normalizedEmail = validateEmail(email);

    if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 1024) {
        throw new HttpError(400, 'password must contain at least 8 characters and at most 1024 bytes');
    }

    if (confirmation !== undefined && (typeof confirmation !== 'string' || confirmation !== password)) {
        throw new HttpError(400, 'password confirmation does not match password');
    }

    const rawFullName = full_name !== undefined ? full_name : fullName;
    let normalizedFullName = login.trim();
    if (rawFullName !== undefined) {
        if (typeof rawFullName !== 'string' || !rawFullName.trim() || rawFullName.trim().length > 100) {
            throw new HttpError(400, 'full_name must contain 1 to 100 characters');
        }
        normalizedFullName = rawFullName.trim();
    }

    return {
        login: login.trim(),
        email: normalizedEmail,
        password,
        fullName: normalizedFullName
    };
}

function validatePasswordResetRequest(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new HttpError(400, 'A JSON object with email is required');
    }
    return { email: validateEmail(input.email) };
}

function validatePasswordResetConfirm(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new HttpError(400, 'A JSON object with password is required');
    }

    const password = input.new_password !== undefined ? input.new_password : (input.password !== undefined ? input.password : null);
    const confirmation = input.password_confirmation !== undefined ? input.password_confirmation : input.passwordConfirmation;

    if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 1024) {
        throw new HttpError(400, 'password must contain at least 8 characters and at most 1024 bytes');
    }

    if (confirmation !== undefined && (typeof confirmation !== 'string' || confirmation !== password)) {
        throw new HttpError(400, 'password confirmation does not match password');
    }

    return { password };
}

module.exports = {
    validateLogin,
    validateRegister,
    validatePasswordResetRequest,
    validatePasswordResetConfirm
};
