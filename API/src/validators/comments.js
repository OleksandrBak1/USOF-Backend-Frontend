const HttpError = require('../errors/HttpError');
const { validateObject, validateId } = require('./common');

function validateCommentCreate(input) {
    validateObject(input, ['content', 'parent_comment_id']);

    const content = typeof input.content === 'string' && input.content.trim()
        ? input.content.trim()
        : null;

    if (!content) {
        throw new HttpError(400, 'content must contain non-empty text');
    }

    let parentCommentId = null;
    if (input.parent_comment_id !== undefined && input.parent_comment_id !== null) {
        parentCommentId = validateId(String(input.parent_comment_id));
    }

    return { content, parent_comment_id: parentCommentId };
}

function validateCommentUpdate(input) {
    if (Object.hasOwn(input, 'content')) {
        throw new HttpError(403, 'Comment content is not editable');
    }

    validateObject(input, ['status']);

    if (!input.status || (input.status !== 'active' && input.status !== 'inactive')) {
        throw new HttpError(400, 'status must be active or inactive');
    }

    return { status: input.status };
}

module.exports = {
    validateCommentCreate,
    validateCommentUpdate
};
