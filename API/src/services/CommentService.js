const HttpError = require('../errors/HttpError');

class CommentService {
    constructor(comments, posts, creativeService = null) {
        this.comments = comments;
        this.posts = posts;
        this.creativeService = creativeService;
    }

    async create(postId, data, authorId) {
        const post = await this.posts.findPostById(postId);
        if (!post) {
            throw new HttpError(404, 'Post not found');
        }

        if (post.status !== 'active') {
            throw new HttpError(403, 'Cannot comment on inactive post');
        }

        if (data.parent_comment_id) {
            const parent = await this.comments.findById(data.parent_comment_id);
            if (!parent) {
                throw new HttpError(400, 'Parent comment does not exist');
            }
            if (parent.post_id !== postId) {
                throw new HttpError(400, 'Parent comment does not belong to this post');
            }
        }

        const commentId = await this.comments.create({
            author_id: authorId,
            post_id: postId,
            parent_comment_id: data.parent_comment_id || null,
            content: data.content,
            status: 'active'
        });

        if (this.creativeService) {
            this.creativeService.notifySubscribers(postId, 'new comment', {
                author_id: authorId,
                summary: data.content
            }).catch(() => {});
        }

        return await this.get(commentId, { id: authorId, role: 'user' });
    }

    async get(id, requester = null) {
        const comment = await this.comments.findById(id);
        if (!comment) {
            throw new HttpError(404, 'Comment not found');
        }

        if (comment.status === 'inactive') {
            const isAuthorized = requester && (requester.role === 'admin' || requester.id === comment.author_id);
            if (!isAuthorized) {
                throw new HttpError(404, 'Comment not found');
            }
        }

        return comment;
    }

    async listByPost(postId, requester = null) {
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

        const comments = await this.comments.findByPostId(postId);
        return comments.filter(c => {
            if (c.status === 'active') return true;
            return requester && (requester.role === 'admin' || requester.id === c.author_id);
        });
    }

    async update(id, changes, requester) {
        const comment = await this.comments.findById(id);
        if (!comment) {
            throw new HttpError(404, 'Comment not found');
        }

        const isAuthor = requester && requester.id === comment.author_id;
        const isAdmin = requester && requester.role === 'admin';

        if (!isAuthor && !isAdmin) {
            throw new HttpError(403, 'You do not have permission to edit this comment');
        }

        if (changes.status) {
            await this.comments.updateStatus(id, changes.status);
        }

        return await this.get(id, requester);
    }

    async delete(id, requester) {
        const comment = await this.comments.findById(id);
        if (!comment) {
            throw new HttpError(404, 'Comment not found');
        }

        const isAuthor = requester && requester.id === comment.author_id;
        const isAdmin = requester && requester.role === 'admin';

        if (!isAuthor && !isAdmin) {
            throw new HttpError(403, 'You do not have permission to delete this comment');
        }

        await this.comments.delete(id);
    }

    async toggleSolution(id, requester) {
        const comment = await this.comments.findById(id);
        if (!comment) {
            throw new HttpError(404, 'Comment not found');
        }

        const post = await this.posts.findPostById(comment.post_id);
        if (!post) {
            throw new HttpError(404, 'Post not found');
        }

        const isPostAuthor = requester && requester.id === post.author_id;
        const isAdmin = requester && requester.role === 'admin';

        if (!isPostAuthor && !isAdmin) {
            throw new HttpError(403, 'Only the author of the post or an admin can mark a solution');
        }

        if (post.status !== 'active') {
            throw new HttpError(403, 'Cannot mark solution on inactive post');
        }

        if (comment.status !== 'active') {
            throw new HttpError(403, 'Cannot mark inactive comment as solution');
        }

        const willBeSolution = !comment.is_solution;
        if (willBeSolution) {
            await this.comments.clearSolutionByPostId(comment.post_id);
            await this.comments.setSolution(id, true);

            if (this.creativeService) {
                this.creativeService.notifySubscribers(post.id, 'accepted solution', {
                    author_id: requester.id,
                    summary: `A solution has been accepted on post #${post.id}!`
                }).catch(() => {});
            }
        } else {
            await this.comments.setSolution(id, false);
        }

        return {
            solution: willBeSolution,
            comment_id: comment.id,
            post_id: post.id
        };
    }
}

module.exports = CommentService;
