const HttpError = require('../errors/HttpError');
const { validateObject } = require('./common');

function validateLikeInput(input) {
    validateObject(input, ['type']);

    if (input.type !== 'like' && input.type !== 'dislike') {
        throw new HttpError(400, 'type must be like or dislike');
    }

    return { type: input.type };
}

module.exports = {
    validateLikeInput
};
