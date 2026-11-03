class SubscriptionRepository {
    constructor(database) {
        this.database = database;
    }

    async subscribe(userId, postId) {
        await this.database.execute(
            'INSERT IGNORE INTO subscriptions (user_id, post_id) VALUES (?, ?)',
            [userId, postId]
        );
    }

    async unsubscribe(userId, postId) {
        const [result] = await this.database.execute(
            'DELETE FROM subscriptions WHERE user_id = ? AND post_id = ?',
            [userId, postId]
        );
        return result.affectedRows > 0;
    }

    async isSubscribed(userId, postId) {
        const [rows] = await this.database.execute(
            'SELECT 1 FROM subscriptions WHERE user_id = ? AND post_id = ?',
            [userId, postId]
        );
        return rows.length > 0;
    }

    async findSubscribersByPostId(postId) {
        const [rows] = await this.database.execute(
            `SELECT u.id, u.id AS user_id, u.email, u.full_name, u.login
             FROM subscriptions s
             JOIN users u ON u.id = s.user_id
             WHERE s.post_id = ?`,
            [postId]
        );
        return rows;
    }
}

module.exports = SubscriptionRepository;
