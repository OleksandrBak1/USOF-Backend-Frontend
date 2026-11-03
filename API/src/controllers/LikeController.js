const { validateId } = require('../validators/common');
const { validateLikeInput } = require('../validators/likes');

class LikeController {
    constructor(likeService) {
        this.likes = likeService;
        for (const action of [
            'getPostLikes', 'createPostLike', 'deletePostLike',
            'getCommentLikes', 'createCommentLike', 'deleteCommentLike'
        ]) {
            this[action] = this[action].bind(this);
        }
    }

    async getPostLikes(req, res) {
        const postId = validateId(req.params.post_id);
        const likes = await this.likes.getPostLikes(postId, req.user);
        res.json(likes);
    }

    async createPostLike(req, res) {
        const postId = validateId(req.params.post_id);
        const { type } = validateLikeInput(req.body);
        const reaction = await this.likes.addOrUpdatePostLike(postId, type, req.user);
        res.status(200).json(reaction);
    }

    async deletePostLike(req, res) {
        const postId = validateId(req.params.post_id);
        await this.likes.removePostLike(postId, req.user);
        res.status(204).end();
    }

    async getCommentLikes(req, res) {
        const commentId = validateId(req.params.comment_id);
        const likes = await this.likes.getCommentLikes(commentId, req.user);
        res.json(likes);
    }

    async createCommentLike(req, res) {
        const commentId = validateId(req.params.comment_id);
        const { type } = validateLikeInput(req.body);
        const reaction = await this.likes.addOrUpdateCommentLike(commentId, type, req.user);
        res.status(200).json(reaction);
    }

    async deleteCommentLike(req, res) {
        const commentId = validateId(req.params.comment_id);
        await this.likes.removeCommentLike(commentId, req.user);
        res.status(204).end();
    }
}

module.exports = LikeController;
