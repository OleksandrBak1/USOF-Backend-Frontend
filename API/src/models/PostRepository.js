class PostRepository {
    constructor(database) {
        this.database = database;
    }

    async create({ author_id, title, content, picture = null, status = 'active' }) {
        const [result] = await this.database.execute(
            'INSERT INTO posts (author_id, title, content, picture, status) VALUES (?, ?, ?, ?, ?)',
            [author_id, title, content, picture, status]
        );
        return result.insertId;
    }

    async setPostCategories(postId, categoryIds) {
        await this.database.execute('DELETE FROM post_categories WHERE post_id = ?', [postId]);
        if (!categoryIds || categoryIds.length === 0) return;

        const values = [];
        const placeholders = categoryIds.map(catId => {
            values.push(postId, catId);
            return '(?, ?)';
        }).join(', ');

        await this.database.execute(
            `INSERT INTO post_categories (post_id, category_id) VALUES ${placeholders}`,
            values
        );
    }

    async findCategoriesByPostId(postId) {
        const [rows] = await this.database.execute(
            `SELECT c.id, c.title, c.description 
             FROM categories c 
             JOIN post_categories pc ON pc.category_id = c.id 
             WHERE pc.post_id = ? 
             ORDER BY c.id`,
            [postId]
        );
        return rows;
    }

    async findCategoriesForPosts(postIds) {
        if (!postIds || postIds.length === 0) return {};
        const placeholders = postIds.map(() => '?').join(', ');
        const [rows] = await this.database.query(
            `SELECT pc.post_id, c.id, c.title, c.description 
             FROM categories c 
             JOIN post_categories pc ON pc.category_id = c.id 
             WHERE pc.post_id IN (${placeholders}) 
             ORDER BY c.id`,
            postIds
        );
        const map = {};
        for (const row of rows) {
            if (!map[row.post_id]) map[row.post_id] = [];
            map[row.post_id].push({
                id: row.id,
                title: row.title,
                description: row.description
            });
        }
        return map;
    }

    async findCommentStatsForPosts(postIds) {
        if (!postIds || postIds.length === 0) return {};
        const placeholders = postIds.map(() => '?').join(', ');
        const [rows] = await this.database.query(
            `SELECT post_id,
                    COUNT(*) AS comments_count,
                    COALESCE(SUM(CASE WHEN is_solution = 1 THEN 1 ELSE 0 END), 0) AS solutions_count
             FROM comments
             WHERE post_id IN (${placeholders})
             GROUP BY post_id`,
            postIds
        );
        const map = {};
        for (const row of rows) {
            const solCount = Number(row.solutions_count);
            map[row.post_id] = {
                comments_count: Number(row.comments_count),
                has_solution: solCount > 0,
                solutions_count: solCount
            };
        }
        return map;
    }

    async findPostById(id) {
        const [rows] = await this.database.execute(
            `SELECT p.id, p.author_id, p.title, p.publish_date, p.status, p.content, p.picture,
                    u.login AS author_login, u.full_name AS author_full_name,
                    u.profile_picture AS author_avatar, u.rating AS author_rating,
                    COALESCE(SUM(CASE WHEN l.type = 'like' THEN 1 ELSE 0 END), 0) AS likes_count,
                    COALESCE(SUM(CASE WHEN l.type = 'dislike' THEN 1 ELSE 0 END), 0) AS dislikes_count
            FROM posts p
            JOIN users u ON u.id = p.author_id
            LEFT JOIN likes l ON l.post_id = p.id
            WHERE p.id = ?
            GROUP BY p.id, u.id`,
            [id]
        );
        if (!rows[0]) return null;
        const post = rows[0];
        post.likes_count = Number(post.likes_count);
        post.dislikes_count = Number(post.dislikes_count);
        post.rating = post.likes_count - post.dislikes_count;
        post.categories = await this.findCategoriesByPostId(id);
        const stats = await this.findCommentStatsForPosts([id]);
        post.comments_count = stats[id]?.comments_count || 0;
        post.has_solution = stats[id]?.has_solution || false;
        post.solutions_count = stats[id]?.solutions_count || 0;
        return post;
    }

    async findPosts({ page = 1, limit = 10, orderBy = 'likes', order = 'desc', categoryId = null, categoryIds = null, authorId = null, status = null, dateFrom = null, dateTo = null, requester = null }) {
        const conditions = [];
        const params = [];

        // Visibility / Status Access Control
        if (requester && requester.role === 'admin') {
            if (status) {
                conditions.push('p.status = ?');
                params.push(status);
            }
        } else if (requester) {
            if (status === 'active') {
                conditions.push('p.status = "active"');
            } else if (status === 'inactive') {
                conditions.push('(p.status = "inactive" AND p.author_id = ?)');
                params.push(requester.id);
            } else {
                conditions.push('(p.status = "active" OR (p.status = "inactive" AND p.author_id = ?))');
                params.push(requester.id);
            }
        } else {
            // Guest can only see active posts
            conditions.push('p.status = "active"');
        }

        if (authorId) {
            conditions.push('p.author_id = ?');
            params.push(authorId);
        }

        if (categoryIds && categoryIds.length > 0) {
            const placeholders = categoryIds.map(() => '?').join(', ');
            conditions.push(
                `p.id IN (SELECT post_id FROM post_categories WHERE category_id IN (${placeholders}) GROUP BY post_id HAVING COUNT(DISTINCT category_id) = ?)`
            );
            params.push(...categoryIds, categoryIds.length);
        } else if (categoryId) {
            conditions.push('p.id IN (SELECT post_id FROM post_categories WHERE category_id = ?)');
            params.push(categoryId);
        }

        if (dateFrom) {
            conditions.push('p.publish_date >= ?');
            params.push(dateFrom);
        }

        if (dateTo) {
            conditions.push('p.publish_date <= ?');
            params.push(dateTo);
        }

        const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Total count query
        const [countRows] = await this.database.execute(
            `SELECT COUNT(DISTINCT p.id) AS total FROM posts p ${whereSql}`,
            params
        );
        const total = Number(countRows[0].total);

        // Sorting
        const dir = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const orderClause = orderBy === 'publish_date'
            ? `ORDER BY p.publish_date ${dir}, p.id DESC`
            : `ORDER BY likes_count ${dir}, p.publish_date DESC, p.id DESC`;

        const offset = (page - 1) * limit;
        const queryParams = [...params, limit, offset];

        const [rows] = await this.database.query(
            `SELECT p.id, p.author_id, p.title, p.publish_date, p.status, p.content, p.picture,
                    u.login AS author_login, u.full_name AS author_full_name,
                    u.profile_picture AS author_avatar, u.rating AS author_rating,
                    COALESCE(SUM(CASE WHEN l.type = 'like' THEN 1 ELSE 0 END), 0) AS likes_count,
                    COALESCE(SUM(CASE WHEN l.type = 'dislike' THEN 1 ELSE 0 END), 0) AS dislikes_count
            FROM posts p
            JOIN users u ON u.id = p.author_id
            LEFT JOIN likes l ON l.post_id = p.id
            ${whereSql}
            GROUP BY p.id, u.id
            ${orderClause}
            LIMIT ? OFFSET ?`,
            queryParams
        );

        const postIds = rows.map(r => r.id);
        const categoriesMap = await this.findCategoriesForPosts(postIds);
        const statsMap = await this.findCommentStatsForPosts(postIds);

        const data = rows.map(row => {
            const likesCount = Number(row.likes_count);
            const dislikesCount = Number(row.dislikes_count);
            const stats = statsMap[row.id] || { comments_count: 0, has_solution: false, solutions_count: 0 };
            return {
                ...row,
                likes_count: likesCount,
                dislikes_count: dislikesCount,
                rating: likesCount - dislikesCount,
                comments_count: stats.comments_count,
                has_solution: stats.has_solution,
                solutions_count: stats.solutions_count,
                categories: categoriesMap[row.id] || []
            };
        });

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1
            }
        };
    }

    async updatePost(id, changes) {
        const assignments = [];
        const values = [];

        for (const field of ['title', 'content', 'status', 'picture']) {
            if (Object.hasOwn(changes, field)) {
                assignments.push(`${field} = ?`);
                values.push(changes[field]);
            }
        }

        if (assignments.length > 0) {
            await this.database.execute(
                `UPDATE posts SET ${assignments.join(', ')} WHERE id = ?`,
                [...values, id]
            );
        }
    }

    async updatePicture(id, pictureUrl) {
        await this.database.execute('UPDATE posts SET picture = ? WHERE id = ?', [pictureUrl, id]);
    }

    async deletePost(id) {
        const [result] = await this.database.execute('DELETE FROM posts WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = PostRepository;
