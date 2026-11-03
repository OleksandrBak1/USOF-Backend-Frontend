class CommentRepository {
    constructor(database) {
        this.database = database;
    }

    async create({ author_id, post_id, parent_comment_id = null, content, status = 'active' }) {
        const [result] = await this.database.execute(
            `INSERT INTO comments (author_id, post_id, parent_comment_id, content, status)
             VALUES (?, ?, ?, ?, ?)`,
            [author_id, post_id, parent_comment_id, content, status]
        );
        return result.insertId;
    }

    async findById(id) {
        const [rows] = await this.database.execute(
            `SELECT c.id, c.author_id, c.post_id, c.parent_comment_id, c.publish_date, c.status, c.content, c.is_solution,
                    u.login AS author_login, u.full_name AS author_full_name,
                    u.profile_picture AS author_avatar, u.rating AS author_rating,
                    COALESCE(SUM(CASE WHEN l.type = 'like' THEN 1 ELSE 0 END), 0) AS likes_count,
                    COALESCE(SUM(CASE WHEN l.type = 'dislike' THEN 1 ELSE 0 END), 0) AS dislikes_count
             FROM comments c
             JOIN users u ON u.id = c.author_id
             LEFT JOIN likes l ON l.comment_id = c.id
             WHERE c.id = ?
             GROUP BY c.id, u.id`,
            [id]
        );
        if (!rows[0]) return null;
        const row = rows[0];
        row.likes_count = Number(row.likes_count);
        row.dislikes_count = Number(row.dislikes_count);
        row.rating = row.likes_count - row.dislikes_count;
        row.is_solution = Boolean(row.is_solution);
        return row;
    }

    async findByPostId(postId) {
        const [rows] = await this.database.execute(
            `SELECT c.id, c.author_id, c.post_id, c.parent_comment_id, c.publish_date, c.status, c.content, c.is_solution,
                    u.login AS author_login, u.full_name AS author_full_name,
                    u.profile_picture AS author_avatar, u.rating AS author_rating,
                    COALESCE(SUM(CASE WHEN l.type = 'like' THEN 1 ELSE 0 END), 0) AS likes_count,
                    COALESCE(SUM(CASE WHEN l.type = 'dislike' THEN 1 ELSE 0 END), 0) AS dislikes_count
             FROM comments c
             JOIN users u ON u.id = c.author_id
             LEFT JOIN likes l ON l.comment_id = c.id
             WHERE c.post_id = ?
             GROUP BY c.id, u.id
             ORDER BY c.is_solution DESC, c.publish_date ASC, c.id ASC`,
            [postId]
        );
        return rows.map(r => {
            const likesCount = Number(r.likes_count);
            const dislikesCount = Number(r.dislikes_count);
            return {
                ...r,
                likes_count: likesCount,
                dislikes_count: dislikesCount,
                rating: likesCount - dislikesCount,
                is_solution: Boolean(r.is_solution)
            };
        });
    }

    async setSolution(commentId, isSolution) {
        await this.database.execute(
            'UPDATE comments SET is_solution = ? WHERE id = ?',
            [isSolution ? 1 : 0, commentId]
        );
    }

    async clearSolutionByPostId(postId) {
        await this.database.execute(
            'UPDATE comments SET is_solution = FALSE WHERE post_id = ?',
            [postId]
        );
    }

    async updateStatus(id, status) {
        await this.database.execute(
            'UPDATE comments SET status = ? WHERE id = ?',
            [status, id]
        );
    }

    async delete(id) {
        const [result] = await this.database.execute(
            'DELETE FROM comments WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = CommentRepository;
