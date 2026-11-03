const HttpError = require('../errors/HttpError');

function errorHandler(err, req, res, next) {
    if (err instanceof HttpError) {
        return res.status(err.status).json({ status: 'error', message: err.message });
    }

    if (err instanceof SyntaxError && err.status === 400 && err.type === 'entity.parse.failed') {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid JSON payload'
        });
    }

    if (err.type === 'entity.too.large') {
        return res.status(413).json({ status: 'error', message: 'Request body is too large' });
    }

    console.error('Request failed with an internal error:', err);

    return res.status(500).json({
        status: 'error',
        message: err.message || 'Internal server error'
    });
}

module.exports = errorHandler;
