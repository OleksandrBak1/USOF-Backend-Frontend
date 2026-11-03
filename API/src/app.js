const path = require('node:path');
const express = require('express');

const healthRoutes = require('./routes/health.routes');
const createAuthRoutes = require('./routes/auth.routes');
const createCategoryRoutes = require('./routes/categories.routes');
const createUserRoutes = require('./routes/users.routes');
const createPostRoutes = require('./routes/posts.routes');
const createCommentRoutes = require('./routes/comments.routes');
const api = require('./config/api');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

function createApp(dependencies = api) {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/uploads', express.static(path.resolve(__dirname, '..', '..', 'uploads')));

    app.use('/api', healthRoutes);
    const authRouter = createAuthRoutes(dependencies.auth.controller, dependencies.auth.middleware);
    app.use('/api/auth', authRouter);
    app.post('/api/register', dependencies.auth.controller.register);
    app.post('/api/login', dependencies.auth.controller.login);
    app.post('/api/logout', dependencies.auth.middleware.requireAuth, dependencies.auth.controller.logout);
    if (dependencies.categories) {
        app.use('/api/categories', createCategoryRoutes(dependencies.categories, dependencies.auth.middleware, dependencies.posts));
    }
    if (dependencies.users) {
        app.use('/api/users', createUserRoutes(dependencies.users, dependencies.auth.middleware));
    }
    if (dependencies.posts) {
        app.use('/api/posts', createPostRoutes(dependencies.posts, dependencies.auth.middleware, dependencies.comments, dependencies.likes, dependencies.creative));
    }
    if (dependencies.comments) {
        app.use('/api/comments', createCommentRoutes(dependencies.comments, dependencies.auth.middleware, dependencies.likes));
    }

    app.use(notFound);
    app.use(errorHandler);

    return app;
}

module.exports = createApp();
module.exports.createApp = createApp;
