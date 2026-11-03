const HttpError = require('../errors/HttpError');

class CreativeService {
    constructor(favorites, subscriptions, posts, emailService = null) {
        this.favorites = favorites;
        this.subscriptions = subscriptions;
        this.posts = posts;
        this.emailService = emailService;
    }

    async addFavorite(userId, postId) {
        const post = await this.posts.findPostById(postId);
        if (!post) {
            throw new HttpError(404, 'Post not found');
        }
        if (post.status !== 'active') {
            throw new HttpError(403, 'Cannot favorite inactive post');
        }

        await this.favorites.add(userId, postId);
        return { favorited: true, post_id: postId };
    }

    async removeFavorite(userId, postId) {
        const post = await this.posts.findPostById(postId);
        if (!post) {
            throw new HttpError(404, 'Post not found');
        }

        await this.favorites.remove(userId, postId);
        return { favorited: false, post_id: postId };
    }

    async getFavorites(userId, pagination = {}) {
        const page = Math.max(1, parseInt(pagination.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(pagination.limit, 10) || 10));
        return await this.favorites.findUserFavorites(userId, { page, limit });
    }

    async subscribe(userId, postId) {
        const post = await this.posts.findPostById(postId);
        if (!post) {
            throw new HttpError(404, 'Post not found');
        }
        if (post.status !== 'active') {
            throw new HttpError(403, 'Cannot subscribe to inactive post');
        }

        await this.subscriptions.subscribe(userId, postId);
        return { subscribed: true, post_id: postId };
    }

    async unsubscribe(userId, postId) {
        const post = await this.posts.findPostById(postId);
        if (!post) {
            throw new HttpError(404, 'Post not found');
        }

        await this.subscriptions.unsubscribe(userId, postId);
        return { subscribed: false, post_id: postId };
    }

    async getSubscribers(postId) {
        const post = await this.posts.findPostById(postId);
        if (!post) {
            throw new HttpError(404, 'Post not found');
        }

        return await this.subscriptions.findSubscribersByPostId(postId);
    }

    async notifySubscribers(postId, eventName, eventData = {}) {
        const subscribers = await this.subscriptions.findSubscribersByPostId(postId);
        if (!this.emailService || subscribers.length === 0) return;

        for (const sub of subscribers) {
            if (sub.id !== eventData.author_id) {
                await this.emailService.sendMail({
                    to: sub.email,
                    subject: `USOF: New update on post #${postId}`,
                    text: `Hello ${sub.full_name},\n\nThere is a new ${eventName} on post #${postId}:\n${eventData.summary || ''}\n\nCheck it out on USOF!`
                }).catch(() => {});
            }
        }
    }
}

module.exports = CreativeService;
