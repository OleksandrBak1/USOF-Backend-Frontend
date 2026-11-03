class LikeRepository {
    constructor(database) {
        this.database = database;
    }

    async createOrUpdateForPost(postId, authorId, type) {
        await this.database.execute(
            `INSERT INTO likes (author_id, post_id, type)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE type = VALUES(type), publish_date = CURRENT_TIMESTAMP`,
            [authorId, postId, type]
        );
    }

    async createOrUpdateForComment(commentId, authorId, type) {
        await this.database.execute(
            `INSERT INTO likes (author_id, comment_id, type)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE type = VALUES(type), publish_date = CURRENT_TIMESTAMP`,
            [authorId, commentId, type]
        );
    }

    async findByPostId(postId) {
        const [rows] = await this.database.execute(
            `SELECT l.id, l.author_id, l.publish_date, l.post_id, l.type,
                    u.login AS author_login, u.full_name AS author_full_name,
                    u.profile_picture AS author_avatar, u.rating AS author_rating
             FROM likes l
             JOIN users u ON u.id = l.author_id
             WHERE l.post_id = ?
             ORDER BY l.publish_date ASC`,
            [postId]
        );
        return rows;
    }

    async findByCommentId(commentId) {
        const [rows] = await this.database.execute(
            `SELECT l.id, l.author_id, l.publish_date, l.comment_id, l.type,
                    u.login AS author_login, u.full_name AS author_full_name,
                    u.profile_picture AS author_avatar, u.rating AS author_rating
             FROM likes l
             JOIN users u ON u.id = l.author_id
             WHERE l.comment_id = ?
             ORDER BY l.publish_date ASC`,
            [commentId]
        );
        return rows;
    }

    async findUserReactionForPost(postId, authorId) {
        const [rows] = await this.database.execute(
            'SELECT id, author_id, post_id, type FROM likes WHERE post_id = ? AND author_id = ?',
            [postId, authorId]
        );
        return rows[0] || null;
    }

    async findUserReactionForComment(commentId, authorId) {
        const [rows] = await this.database.execute(
            'SELECT id, author_id, comment_id, type FROM likes WHERE comment_id = ? AND author_id = ?',
            [commentId, authorId]
        );
        return rows[0] || null;
    }

    async deleteFromPost(postId, authorId) {
        const [result] = await this.database.execute(
            'DELETE FROM likes WHERE post_id = ? AND author_id = ?',
            [postId, authorId]
        );
        return result.affectedRows > 0;
    }

    async deleteFromComment(commentId, authorId) {
        const [result] = await this.database.execute(
            'DELETE FROM likes WHERE comment_id = ? AND author_id = ?',
            [commentId, authorId]
        );
        return result.affectedRows > 0;
    }

    async recalculateUserRating(userId) {
        await this.database.execute(
            `UPDATE users
             SET rating = (
                 SELECT COALESCE(SUM(CASE WHEN l.type = 'like' THEN 1 WHEN l.type = 'dislike' THEN -1 ELSE 0 END), 0)
                 FROM likes l
                 LEFT JOIN posts p ON l.post_id = p.id
                 LEFT JOIN comments c ON l.comment_id = c.id
                 WHERE p.author_id = ? OR c.author_id = ?
             )
             WHERE id = ?`,
            [userId, userId, userId]
        );
    }
}

module.exports = LikeRepository;
