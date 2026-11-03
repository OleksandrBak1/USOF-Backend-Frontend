class FavoriteRepository {
    constructor(database) {
        this.database = database;
    }

    async add(userId, postId) {
        await this.database.execute(
            'INSERT IGNORE INTO favorites (user_id, post_id) VALUES (?, ?)',
            [userId, postId]
        );
    }

    async remove(userId, postId) {
        const [result] = await this.database.execute(
            'DELETE FROM favorites WHERE user_id = ? AND post_id = ?',
            [userId, postId]
        );
        return result.affectedRows > 0;
    }

    async isFavorite(userId, postId) {
        const [rows] = await this.database.execute(
            'SELECT 1 FROM favorites WHERE user_id = ? AND post_id = ?',
            [userId, postId]
        );
        return rows.length > 0;
    }

    async findUserFavorites(userId, { page = 1, limit = 10 } = {}) {
        const offset = (page - 1) * limit;

        const [countRows] = await this.database.execute(
            `SELECT COUNT(*) AS total
             FROM favorites f
             JOIN posts p ON p.id = f.post_id
             WHERE f.user_id = ? AND p.status = 'active'`,
            [userId]
        );
        const total = Number(countRows[0].total);

        const [rows] = await this.database.execute(
            `SELECT p.id, p.author_id, p.title, p.publish_date, p.status, p.content,
                    u.login AS author_login, u.full_name AS author_full_name,
                    u.profile_picture AS author_avatar, u.rating AS author_rating,
                    COALESCE(SUM(CASE WHEN l.type = 'like' THEN 1 ELSE 0 END), 0) AS likes_count,
                    COALESCE(SUM(CASE WHEN l.type = 'dislike' THEN 1 ELSE 0 END), 0) AS dislikes_count,
                    f.created_at AS favorited_at
             FROM favorites f
             JOIN posts p ON p.id = f.post_id
             JOIN users u ON u.id = p.author_id
             LEFT JOIN likes l ON l.post_id = p.id
             WHERE f.user_id = ? AND p.status = 'active'
             GROUP BY p.id, u.id, f.created_at
             ORDER BY f.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, String(limit), String(offset)]
        );

        const postIds = rows.map(r => r.id);
        const statsMap = {};
        if (postIds.length > 0) {
            const placeholders = postIds.map(() => '?').join(', ');
            const [statRows] = await this.database.query(
                `SELECT post_id,
                        COUNT(*) AS comments_count,
                        COALESCE(SUM(CASE WHEN is_solution = 1 THEN 1 ELSE 0 END), 0) AS solutions_count
                 FROM comments
                 WHERE post_id IN (${placeholders})
                 GROUP BY post_id`,
                postIds
            );
            for (const s of statRows) {
                const solCount = Number(s.solutions_count);
                statsMap[s.post_id] = {
                    comments_count: Number(s.comments_count),
                    has_solution: solCount > 0,
                    solutions_count: solCount
                };
            }
        }

        return {
            data: rows.map(r => {
                const stats = statsMap[r.id] || { comments_count: 0, has_solution: false, solutions_count: 0 };
                return {
                    ...r,
                    likes_count: Number(r.likes_count),
                    dislikes_count: Number(r.dislikes_count),
                    rating: Number(r.likes_count) - Number(r.dislikes_count),
                    comments_count: stats.comments_count,
                    has_solution: stats.has_solution,
                    solutions_count: stats.solutions_count
                };
            }),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1
            }
        };
    }
}

module.exports = FavoriteRepository;
