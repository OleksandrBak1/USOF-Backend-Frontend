const { Router } = require('express');
const { upload } = require('../middlewares/upload');

function createUserRoutes(controller, middleware) {
    const router = Router();
    router.use((req, res, next) => {
        res.set('Cache-Control', 'no-store');
        next();
    });

    router.get('/', middleware.requireAdmin, controller.list);
    router.post('/', middleware.requireAdmin, controller.create);
    router.patch('/avatar', middleware.requireAuth, upload.single('avatar'), controller.uploadAvatar);
    router.get('/:user_id', middleware.optionalAuth, controller.get);
    router.patch('/:user_id', middleware.requireAuth, controller.update);
    router.put('/:user_id', middleware.requireAuth, controller.update);
    router.delete('/:user_id', middleware.requireAdmin, controller.delete);
    return router;
}

module.exports = createUserRoutes;
