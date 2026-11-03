const { validateId } = require('../validators/common');
const {
    validateCommentCreate,
    validateCommentUpdate
} = require('../validators/comments');

class CommentController {
    constructor(commentService) {
        this.comments = commentService;
        for (const action of ['listByPost', 'createForPost', 'get', 'update', 'delete', 'toggleSolution']) {
            this[action] = this[action].bind(this);
        }
    }

    async listByPost(req, res) {
        const postId = validateId(req.params.post_id);
        const comments = await this.comments.listByPost(postId, req.user);
        res.json(comments);
    }

    async createForPost(req, res) {
        const postId = validateId(req.params.post_id);
        const data = validateCommentCreate(req.body);
        const comment = await this.comments.create(postId, data, req.user.id);
        res.status(201).location(`/api/comments/${comment.id}`).json(comment);
    }

    async get(req, res) {
        const commentId = validateId(req.params.comment_id);
        const comment = await this.comments.get(commentId, req.user);
        res.json(comment);
    }

    async update(req, res) {
        const commentId = validateId(req.params.comment_id);
        const changes = validateCommentUpdate(req.body);
        const comment = await this.comments.update(commentId, changes, req.user);
        res.json(comment);
    }

    async delete(req, res) {
        const commentId = validateId(req.params.comment_id);
        await this.comments.delete(commentId, req.user);
        res.status(204).end();
    }

    async toggleSolution(req, res) {
        const commentId = validateId(req.params.comment_id);
        const result = await this.comments.toggleSolution(commentId, req.user);
        res.json(result);
    }
}

module.exports = CommentController;
