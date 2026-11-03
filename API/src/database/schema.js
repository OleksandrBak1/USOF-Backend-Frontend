const TABLES = {
    users: `CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        login VARCHAR(50) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        profile_picture VARCHAR(255) NOT NULL DEFAULT 'default-avatar.png',
        rating INT NOT NULL DEFAULT 0,
        role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
        email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        email_verification_token VARCHAR(255) NULL,
        password_reset_token VARCHAR(255) NULL,
        password_reset_expires DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY users_login_unique (login),
        UNIQUE KEY users_email_unique (email)
    )`,
    categories: `CREATE TABLE IF NOT EXISTS categories (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        title VARCHAR(100) NOT NULL,
        description TEXT NOT NULL DEFAULT (''),
        seed_key VARCHAR(64) NULL,
        PRIMARY KEY (id),
        UNIQUE KEY categories_title_unique (title),
        UNIQUE KEY categories_seed_key_unique (seed_key)
    )`,
    posts: `CREATE TABLE IF NOT EXISTS posts (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        author_id INT UNSIGNED NOT NULL,
        title VARCHAR(255) NOT NULL,
        publish_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        content TEXT NOT NULL,
        picture VARCHAR(255) NULL,
        seed_key VARCHAR(64) NULL,
        PRIMARY KEY (id),
        UNIQUE KEY posts_seed_key_unique (seed_key),
        KEY posts_author_date_index (author_id, publish_date),
        KEY posts_status_date_index (status, publish_date),
        KEY posts_date_index (publish_date),
        CONSTRAINT posts_status_check CHECK (status IN ('active', 'inactive')),
        CONSTRAINT posts_author_fk FOREIGN KEY (author_id) REFERENCES users (id)
            ON DELETE RESTRICT ON UPDATE RESTRICT
    )`,
    post_categories: `CREATE TABLE IF NOT EXISTS post_categories (
        post_id INT UNSIGNED NOT NULL,
        category_id INT UNSIGNED NOT NULL,
        PRIMARY KEY (post_id, category_id),
        KEY post_categories_category_index (category_id, post_id),
        CONSTRAINT post_categories_post_fk FOREIGN KEY (post_id) REFERENCES posts (id)
            ON DELETE CASCADE ON UPDATE RESTRICT,
        CONSTRAINT post_categories_category_fk FOREIGN KEY (category_id) REFERENCES categories (id)
            ON DELETE CASCADE ON UPDATE RESTRICT
    )`,
    comments: `CREATE TABLE IF NOT EXISTS comments (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        author_id INT UNSIGNED NOT NULL,
        post_id INT UNSIGNED NOT NULL,
        parent_comment_id INT UNSIGNED NULL,
        publish_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        content TEXT NOT NULL,
        status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        is_solution BOOLEAN NOT NULL DEFAULT FALSE,
        seed_key VARCHAR(64) NULL,
        PRIMARY KEY (id),
        UNIQUE KEY comments_seed_key_unique (seed_key),
        KEY comments_author_index (author_id),
        KEY comments_post_date_index (post_id, publish_date),
        KEY comments_parent_index (parent_comment_id),
        KEY comments_solution_index (post_id, is_solution),
        CONSTRAINT comments_status_check CHECK (status IN ('active', 'inactive')),
        CONSTRAINT comments_author_fk FOREIGN KEY (author_id) REFERENCES users (id)
            ON DELETE RESTRICT ON UPDATE RESTRICT,
        CONSTRAINT comments_post_fk FOREIGN KEY (post_id) REFERENCES posts (id)
            ON DELETE CASCADE ON UPDATE RESTRICT,
        CONSTRAINT comments_parent_fk FOREIGN KEY (parent_comment_id) REFERENCES comments (id)
            ON DELETE CASCADE ON UPDATE RESTRICT
    )`,
    likes: `CREATE TABLE IF NOT EXISTS likes (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        author_id INT UNSIGNED NOT NULL,
        publish_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        post_id INT UNSIGNED NULL,
        comment_id INT UNSIGNED NULL,
        type ENUM('like', 'dislike') NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY likes_author_post_unique (author_id, post_id),
        UNIQUE KEY likes_author_comment_unique (author_id, comment_id),
        KEY likes_post_type_index (post_id, type),
        KEY likes_comment_type_index (comment_id, type),
        CONSTRAINT likes_one_target_check CHECK ((post_id IS NOT NULL) <> (comment_id IS NOT NULL)),
        CONSTRAINT likes_type_check CHECK (type IN ('like', 'dislike')),
        CONSTRAINT likes_author_fk FOREIGN KEY (author_id) REFERENCES users (id)
            ON DELETE CASCADE ON UPDATE RESTRICT,
        CONSTRAINT likes_post_fk FOREIGN KEY (post_id) REFERENCES posts (id)
            ON DELETE CASCADE ON UPDATE RESTRICT,
        CONSTRAINT likes_comment_fk FOREIGN KEY (comment_id) REFERENCES comments (id)
            ON DELETE CASCADE ON UPDATE RESTRICT
    )`,
    favorites: `CREATE TABLE IF NOT EXISTS favorites (
        user_id INT UNSIGNED NOT NULL,
        post_id INT UNSIGNED NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, post_id),
        KEY favorites_post_index (post_id),
        CONSTRAINT favorites_user_fk FOREIGN KEY (user_id) REFERENCES users (id)
            ON DELETE CASCADE ON UPDATE RESTRICT,
        CONSTRAINT favorites_post_fk FOREIGN KEY (post_id) REFERENCES posts (id)
            ON DELETE CASCADE ON UPDATE RESTRICT
    )`,
    subscriptions: `CREATE TABLE IF NOT EXISTS subscriptions (
        user_id INT UNSIGNED NOT NULL,
        post_id INT UNSIGNED NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, post_id),
        KEY subscriptions_post_index (post_id),
        CONSTRAINT subscriptions_user_fk FOREIGN KEY (user_id) REFERENCES users (id)
            ON DELETE CASCADE ON UPDATE RESTRICT,
        CONSTRAINT subscriptions_post_fk FOREIGN KEY (post_id) REFERENCES posts (id)
            ON DELETE CASCADE ON UPDATE RESTRICT
    )`
};

const TABLE_OPTIONS = ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';

async function migrateExistingTables(database) {
    const [columns] = await database.query(`
        SELECT TABLE_NAME, COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE()
    `);
    const hasCol = (table, col) => columns.some(c => c.TABLE_NAME === table && c.COLUMN_NAME.toLowerCase() === col.toLowerCase());

    if (!hasCol('users', 'email_verified')) {
        await database.query('ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE');
    }
    if (!hasCol('users', 'email_verification_token')) {
        await database.query('ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255) NULL');
    }
    if (!hasCol('users', 'password_reset_token')) {
        await database.query('ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255) NULL');
    }
    if (!hasCol('users', 'password_reset_expires')) {
        await database.query('ALTER TABLE users ADD COLUMN password_reset_expires DATETIME NULL');
    }
    if (!hasCol('users', 'created_at')) {
        await database.query('ALTER TABLE users ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP');
    }
    if (!hasCol('users', 'updated_at')) {
        await database.query('ALTER TABLE users ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    }
    if (!hasCol('comments', 'parent_comment_id')) {
        await database.query('ALTER TABLE comments ADD COLUMN parent_comment_id INT UNSIGNED NULL AFTER post_id');
        await database.query('ALTER TABLE comments ADD KEY comments_parent_index (parent_comment_id)');
        await database.query(`ALTER TABLE comments ADD CONSTRAINT comments_parent_fk FOREIGN KEY (parent_comment_id) REFERENCES comments (id) ON DELETE CASCADE ON UPDATE RESTRICT`);
    }
    if (!hasCol('posts', 'picture')) {
        await database.query('ALTER TABLE posts ADD COLUMN picture VARCHAR(255) NULL AFTER content');
    }
    if (!hasCol('comments', 'is_solution')) {
        await database.query('ALTER TABLE comments ADD COLUMN is_solution BOOLEAN NOT NULL DEFAULT FALSE AFTER status');
        await database.query('ALTER TABLE comments ADD KEY comments_solution_index (post_id, is_solution)');
    }

    const [indexes] = await database.query(`
        SELECT TABLE_NAME, INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'users_email_unique'
    `);
    if (indexes.length === 0) {
        try {
            await database.query('ALTER TABLE users ADD UNIQUE KEY users_email_unique (email)');
        } catch (_) {
        }
    }

    await database.query(TABLES.favorites + TABLE_OPTIONS);
    await database.query(TABLES.subscriptions + TABLE_OPTIONS);
}

async function initializeSchema(database) {
    const [[{ version }]] = await database.query('SELECT VERSION() AS version');
    const [major, minor, patch] = version.split('.').map(Number);
    if (/mariadb/i.test(version) || !Number.isInteger(major) || major < 8 ||
        (major === 8 && minor === 0 && patch < 16)) {
        const error = new Error('MySQL 8.0.16 or newer is required to enforce CHECK constraints.');
        error.code = 'UNSUPPORTED_MYSQL_VERSION';
        throw error;
    }
    for (const sql of Object.values(TABLES)) {
        await database.query(sql + TABLE_OPTIONS);
    }
    await migrateExistingTables(database);
}

module.exports = { initializeSchema, TABLES, TABLE_OPTIONS };
