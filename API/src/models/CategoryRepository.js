class CategoryRepository {
    constructor(database) {
        this.database = database;
    }

    async findAll() {
        const [rows] = await this.database.execute('SELECT id, title, description FROM categories ORDER BY id');
        return rows;
    }

    async findById(id) {
        const [rows] = await this.database.execute(
            'SELECT id, title, description FROM categories WHERE id = ?', [id]
        );
        return rows[0] || null;
    }

    async create({ title, description }) {
        const [result] = await this.database.execute(
            'INSERT INTO categories (title, description) VALUES (?, ?)', [title, description]
        );
        return result.insertId;
    }

    async update(id, changes) {
        const assignments = [];
        const values = [];
        for (const field of ['title', 'description']) {
            if (Object.hasOwn(changes, field)) {
                assignments.push(`${field} = ?`);
                values.push(changes[field]);
            }
        }
        if (!assignments.length) throw new Error('No category fields to update');
        await this.database.execute(`UPDATE categories SET ${assignments.join(', ')} WHERE id = ?`, [...values, id]);
    }

    async delete(id) {
        const [result] = await this.database.execute('DELETE FROM categories WHERE id = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = CategoryRepository;
