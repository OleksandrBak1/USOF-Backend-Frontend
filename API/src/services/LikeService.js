const HttpError = require('../errors/HttpError');

class LikeService {
    constructor(likes, posts, comments) {
        this.likes = likes;
        this.posts = posts;
        this.comments = comments;
    }

    async getPostLikes(postId, requester = null) {
        const post = await this.posts.findPostById(postId);
        if (!post) {
            throw new HttpError(404, 'Post not found');
        }

        if (post.status === 'inactive') {
            const isAuthorized = requester && (requester.role === 'admin' || requester.id === post.author_id);
            if (!isAuthorized) {
                throw new HttpError(404, 'Post not found');
            }
        }

        return await this.likes.findByPostId(postId);
    }

    async addOrUpdatePostLike(postId, type, requester) {
        const post = await this.posts.findPostById(postId);
        if (!post) {
            throw new HttpError(404, 'Post not found');
        }

        if (post.status !== 'active') {
            throw new HttpError(403, 'Cannot react to inactive post');
        }

        await this.likes.createOrUpdateForPost(postId, requester.id, type);
        await this.likes.recalculateUserRating(post.author_id);

        return await this.likes.findUserReactionForPost(postId, requester.id);
    }

    async removePostLike(postId, requester) {
        const post = await this.posts.findPostById(postId);
        if (!post) {
            throw new HttpError(404, 'Post not found');
        }

        const existing = await this.likes.findUserReactionForPost(postId, requester.id);
        if (!existing) {
            throw new HttpError(404, 'Reaction not found');
        }

        await this.likes.deleteFromPost(postId, requester.id);
        await this.likes.recalculateUserRating(post.author_id);
    }

    async getCommentLikes(commentId, requester = null) {
        const comment = await this.comments.findById(commentId);
        if (!comment) {
            throw new HttpError(404, 'Comment not found');
        }

        if (comment.status === 'inactive') {
            const isAuthorized = requester && (requester.role === 'admin' || requester.id === comment.author_id);
            if (!isAuthorized) {
                throw new HttpError(404, 'Comment not found');
            }
        }

        return await this.likes.findByCommentId(commentId);
    }

    async addOrUpdateCommentLike(commentId, type, requester) {
        const comment = await this.comments.findById(commentId);
        if (!comment) {
            throw new HttpError(404, 'Comment not found');
        }

        if (comment.status !== 'active') {
            throw new HttpError(403, 'Cannot react to inactive comment');
        }

        await this.likes.createOrUpdateForComment(commentId, requester.id, type);
        await this.likes.recalculateUserRating(comment.author_id);

        return await this.likes.findUserReactionForComment(commentId, requester.id);
    }

    async removeCommentLike(commentId, requester) {
        const comment = await this.comments.findById(commentId);
        if (!comment) {
            throw new HttpError(404, 'Comment not found');
        }

        const existing = await this.likes.findUserReactionForComment(commentId, requester.id);
        if (!existing) {
            throw new HttpError(404, 'Reaction not found');
        }

        await this.likes.deleteFromComment(commentId, requester.id);
        await this.likes.recalculateUserRating(comment.author_id);
    }
}

module.exports = LikeService;
