const { Router } = require('express');

function createCommentRoutes(controller, middleware, likeController = null) {
    const router = Router();

    router.get('/:comment_id', middleware.optionalAuth, controller.get);
    router.patch('/:comment_id/solution', middleware.requireAuth, controller.toggleSolution);
    router.patch('/:comment_id', middleware.requireAuth, controller.update);
    router.delete('/:comment_id', middleware.requireAuth, controller.delete);

    if (likeController) {
        router.get('/:comment_id/like', middleware.optionalAuth, likeController.getCommentLikes);
        router.post('/:comment_id/like', middleware.requireAuth, likeController.createCommentLike);
        router.delete('/:comment_id/like', middleware.requireAuth, likeController.deleteCommentLike);
    }

    return router;
}

module.exports = createCommentRoutes;
