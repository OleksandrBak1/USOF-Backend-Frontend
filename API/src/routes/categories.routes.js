const { Router } = require('express');

function createCategoryRoutes(controller, middleware, postController = null) {
    const router = Router();
    router.get('/', controller.list);
    router.get('/:category_id', controller.get);
    if (postController) {
        router.get('/:category_id/posts', middleware.optionalAuth, postController.listByCategory);
    }
    router.post('/', middleware.requireAdmin, controller.create);
    router.patch('/:category_id', middleware.requireAdmin, controller.update);
    router.delete('/:category_id', middleware.requireAdmin, controller.delete);
    return router;
}

module.exports = createCategoryRoutes;
