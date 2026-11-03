const { validateId } = require('../validators/common');

class CreativeController {
    constructor(creativeService) {
        this.creative = creativeService;
        for (const action of ['addFavorite', 'removeFavorite', 'getFavorites', 'subscribe', 'unsubscribe', 'getSubscribers']) {
            this[action] = this[action].bind(this);
        }
    }

    async addFavorite(req, res) {
        const postId = validateId(req.params.post_id);
        const result = await this.creative.addFavorite(req.user.id, postId);
        res.status(200).json(result);
    }

    async removeFavorite(req, res) {
        const postId = validateId(req.params.post_id);
        const result = await this.creative.removeFavorite(req.user.id, postId);
        res.status(200).json(result);
    }

    async getFavorites(req, res) {
        const result = await this.creative.getFavorites(req.user.id, req.query);
        res.json(result);
    }

    async subscribe(req, res) {
        const postId = validateId(req.params.post_id);
        const result = await this.creative.subscribe(req.user.id, postId);
        res.status(200).json(result);
    }

    async unsubscribe(req, res) {
        const postId = validateId(req.params.post_id);
        const result = await this.creative.unsubscribe(req.user.id, postId);
        res.status(200).json(result);
    }

    async getSubscribers(req, res) {
        const postId = validateId(req.params.post_id);
        const subscribers = await this.creative.getSubscribers(postId);
        res.json(subscribers);
    }
}

module.exports = CreativeController;
