const { Router } = require('express');
const { uploadPostPicture } = require('../middlewares/upload');

function createPostRoutes(controller, middleware, commentController = null, likeController = null, creativeController = null) {
    const router = Router();

    if (creativeController) {
        router.get('/favorites', middleware.requireAuth, creativeController.getFavorites);
    }

    router.get('/', middleware.optionalAuth, controller.list);
    router.post('/', middleware.requireAuth, controller.create);

    router.get('/:post_id/categories', controller.getCategories);
    router.get('/:post_id', middleware.optionalAuth, controller.get);
    router.patch('/:post_id/picture', middleware.requireAuth, uploadPostPicture.single('picture'), controller.uploadPicture);
    router.post('/:post_id/picture', middleware.requireAuth, uploadPostPicture.single('picture'), controller.uploadPicture);
    router.patch('/:post_id', middleware.requireAuth, controller.update);
    router.delete('/:post_id', middleware.requireAuth, controller.delete);

    if (commentController) {
        router.get('/:post_id/comments', middleware.optionalAuth, commentController.listByPost);
        router.post('/:post_id/comments', middleware.requireAuth, commentController.createForPost);
    }

    if (likeController) {
        router.get('/:post_id/like', middleware.optionalAuth, likeController.getPostLikes);
        router.post('/:post_id/like', middleware.requireAuth, likeController.createPostLike);
        router.delete('/:post_id/like', middleware.requireAuth, likeController.deletePostLike);
    }

    if (creativeController) {
        router.post('/:post_id/favorite', middleware.requireAuth, creativeController.addFavorite);
        router.delete('/:post_id/favorite', middleware.requireAuth, creativeController.removeFavorite);
        router.post('/:post_id/subscribe', middleware.requireAuth, creativeController.subscribe);
        router.delete('/:post_id/subscribe', middleware.requireAuth, creativeController.unsubscribe);
        router.get('/:post_id/subscribers', middleware.optionalAuth, creativeController.getSubscribers);
    }

    return router;
}

module.exports = createPostRoutes;
