const mysql = require('mysql2/promise');
const PasswordService = require('./PasswordService');
const {
    seedUsers,
    standardCategories,
    seedQuestions,
    TEST_PASSWORD
} = require('../database/seedData');

class DatabaseSeeder {
    constructor(connection, passwords = new PasswordService()) {
        this.connection = connection;
        this.passwords = passwords;
    }

    async run() {
        const [[{ lockName }]] = await this.connection.query(
            "SELECT SHA2(CONCAT(DATABASE(), ':usof:seed:v2'), 256) AS lockName"
        );
        const [[{ acquired }]] = await this.connection.execute('SELECT GET_LOCK(?, 30) AS acquired', [lockName]);
        if (acquired !== 1) throw new Error('Could not acquire the database seed lock.');
        try {
            await this.connection.beginTransaction();
            try {
                const result = await this.insertFixtures();
                await this.connection.commit();
                return result;
            } catch (error) {
                await this.connection.rollback();
                throw error;
            }
        } finally {
            await this.connection.execute('SELECT RELEASE_LOCK(?)', [lockName]);
        }
    }

    async ensureUser(userObj) {
        const [existing] = await this.connection.execute(
            'SELECT id, login, email, role FROM users WHERE login = ? OR email = ?',
            [userObj.login, userObj.email]
        );
        if (existing.length) {
            return existing[0].id;
        }
        const hash = await this.passwords.hash(TEST_PASSWORD);
        const [result] = await this.connection.execute(
            `INSERT INTO users (login, password_hash, full_name, email, email_verified)
             VALUES (?, ?, ?, ?, ?)`,
            [userObj.login, hash, userObj.fullName, userObj.email, true]
        );
        return result.insertId;
    }

    async ensureCategory(title, description) {
        const [existing] = await this.connection.execute(
            'SELECT id FROM categories WHERE title = ? LIMIT 1',
            [title]
        );
        if (existing.length) {
            return existing[0].id;
        }
        const [result] = await this.connection.execute(
            'INSERT INTO categories (title, description) VALUES (?, ?)',
            [title, description]
        );
        return result.insertId;
    }

    async insertFixtures() {
        // 1. Seed users (user1 .. user7)
        const userMap = {};
        for (const user of seedUsers) {
            const uid = await this.ensureUser(user);
            userMap[user.login] = uid;
        }

        // 2. Seed standard categories
        const categoryMap = {};
        for (const cat of standardCategories) {
            const cid = await this.ensureCategory(cat.title, cat.description);
            categoryMap[cat.title] = cid;
        }

        let totalPosts = 0;
        let totalComments = 0;
        let totalLikes = 0;

        // 3. Seed questions, answers, and likes
        for (const q of seedQuestions) {
            const authorId = userMap[q.authorLogin];
            if (!authorId) continue;

            const [postResult] = await this.connection.execute(
                `INSERT INTO posts (author_id, title, content, publish_date, status)
                 VALUES (?, ?, ?, ?, ?)`,
                [authorId, q.title, q.content, q.publishDate, q.status || 'active']
            );
            const postId = postResult.insertId;
            totalPosts++;

            // Associate categories
            for (const catTitle of q.categoryTitles) {
                const catId = categoryMap[catTitle];
                if (catId) {
                    await this.connection.execute(
                        'INSERT IGNORE INTO post_categories (post_id, category_id) VALUES (?, ?)',
                        [postId, catId]
                    );
                }
            }

            // Post likes
            if (Array.isArray(q.likers)) {
                for (const likerLogin of q.likers) {
                    const likerId = userMap[likerLogin];
                    if (likerId && likerId !== authorId) {
                        await this.connection.execute(
                            'INSERT IGNORE INTO likes (author_id, post_id, type) VALUES (?, ?, ?)',
                            [likerId, postId, 'like']
                        );
                        totalLikes++;
                    }
                }
            }

            // Add favorites & subscriptions for other users
            for (const otherUser of seedUsers) {
                const oid = userMap[otherUser.login];
                if (oid && oid !== authorId && Math.random() > 0.4) {
                    await this.connection.execute(
                        'INSERT IGNORE INTO favorites (user_id, post_id) VALUES (?, ?)',
                        [oid, postId]
                    );
                    await this.connection.execute(
                        'INSERT IGNORE INTO subscriptions (user_id, post_id) VALUES (?, ?)',
                        [oid, postId]
                    );
                }
            }

            // Answers
            for (const ans of q.answers) {
                const answerAuthorId = userMap[ans.authorLogin];
                if (!answerAuthorId) continue;

                const [commentResult] = await this.connection.execute(
                    `INSERT INTO comments (author_id, post_id, content, publish_date, status, is_solution)
                     VALUES (?, ?, ?, ?, 'active', ?)`,
                    [answerAuthorId, postId, ans.content, ans.publishDate, ans.isSolution ? 1 : 0]
                );
                const commentId = commentResult.insertId;
                totalComments++;

                // Likes on answer
                for (const otherLogin of ['user1', 'user2', 'user3', 'user4']) {
                    const otherId = userMap[otherLogin];
                    if (otherId && otherId !== answerAuthorId) {
                        await this.connection.execute(
                            'INSERT IGNORE INTO likes (author_id, comment_id, type) VALUES (?, ?, ?)',
                            [otherId, commentId, 'like']
                        );
                        totalLikes++;
                    }
                }

                // Nested replies
                if (Array.isArray(ans.replies)) {
                    for (const rep of ans.replies) {
                        const replyAuthorId = userMap[rep.authorLogin];
                        if (replyAuthorId) {
                            await this.connection.execute(
                                `INSERT INTO comments (author_id, post_id, parent_comment_id, content, publish_date, status, is_solution)
                                 VALUES (?, ?, ?, ?, ?, 'active', 0)`,
                                [replyAuthorId, postId, commentId, rep.content, rep.publishDate]
                            );
                            totalComments++;
                        }
                    }
                }
            }
        }

        // 4. Recalculate rating for all seeded users so ratings are non-zero
        for (const login of Object.keys(userMap)) {
            const uid = userMap[login];
            await this.connection.execute(
                `UPDATE users
                 SET rating = (
                     SELECT COALESCE(SUM(CASE WHEN l.type = 'like' THEN 1 WHEN l.type = 'dislike' THEN -1 ELSE 0 END), 0)
                     FROM likes l
                     LEFT JOIN posts p ON l.post_id = p.id
                     LEFT JOIN comments c ON l.comment_id = c.id
                     WHERE p.author_id = ? OR c.author_id = ?
                 )
                 WHERE id = ?`,
                [uid, uid, uid]
            );
        }

        return {
            users: Object.keys(userMap).length,
            categories: Object.keys(categoryMap).length,
            posts: totalPosts,
            comments: totalComments,
            likes: totalLikes
        };
    }
}

module.exports = DatabaseSeeder;
