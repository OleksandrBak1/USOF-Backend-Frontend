const HttpError = require('../errors/HttpError');

class PostService {
    constructor(posts, categories) {
        this.posts = posts;
        this.categories = categories;
    }

    async create(data, authorId) {
        // Validate categories exist
        for (const catId of data.categories) {
            const cat = await this.categories.findById(catId);
            if (!cat) {
                throw new HttpError(400, `Category with id ${catId} does not exist`);
            }
        }

        const postId = await this.posts.create({
            author_id: authorId,
            title: data.title,
            content: data.content,
            status: 'active'
        });

        await this.posts.setPostCategories(postId, data.categories);
        return await this.get(postId, { id: authorId, role: 'user' });
    }

    async get(id, requester = null) {
        const post = await this.posts.findPostById(id);
        if (!post) {
            throw new HttpError(404, 'Post not found');
        }

        if (post.status === 'inactive') {
            const isAuthorized = requester && (requester.role === 'admin' || requester.id === post.author_id);
            if (!isAuthorized) {
                throw new HttpError(404, 'Post not found');
            }
        }

        return post;
    }

    async list(queryParams, requester = null) {
        return await this.posts.findPosts({
            ...queryParams,
            requester
        });
    }

    async listByCategory(categoryId, queryParams, requester = null) {
        const category = await this.categories.findById(categoryId);
        if (!category) {
            throw new HttpError(404, 'Category not found');
        }

        return await this.posts.findPosts({
            ...queryParams,
            categoryId,
            requester
        });
    }

    async update(id, changes, requester) {
        const post = await this.posts.findPostById(id);
        if (!post) {
            throw new HttpError(404, 'Post not found');
        }

        const isAuthor = requester && requester.id === post.author_id;
        const isAdmin = requester && requester.role === 'admin';

        if (!isAuthor && !isAdmin) {
            throw new HttpError(403, 'You do not have permission to edit this post');
        }

        if (changes.categories) {
            for (const catId of changes.categories) {
                const cat = await this.categories.findById(catId);
                if (!cat) {
                    throw new HttpError(400, `Category with id ${catId} does not exist`);
                }
            }
            await this.posts.setPostCategories(id, changes.categories);
        }

        await this.posts.updatePost(id, changes);
        return await this.get(id, requester);
    }

    async delete(id, requester) {
        const post = await this.posts.findPostById(id);
        if (!post) {
            throw new HttpError(404, 'Post not found');
        }

        const isAuthor = requester && requester.id === post.author_id;
        const isAdmin = requester && requester.role === 'admin';

        if (!isAuthor && !isAdmin) {
            throw new HttpError(403, 'You do not have permission to delete this post');
        }

        await this.posts.deletePost(id);
    }

    async getCategories(id) {
        const post = await this.posts.findPostById(id);
        if (!post) {
            throw new HttpError(404, 'Post not found');
        }

        return await this.posts.findCategoriesByPostId(id);
    }

    async updatePicture(id, pictureUrl, requester) {
        const post = await this.posts.findPostById(id);
        if (!post) {
            throw new HttpError(404, 'Post not found');
        }

        const isAuthor = requester && requester.id === post.author_id;
        const isAdmin = requester && requester.role === 'admin';

        if (!isAuthor && !isAdmin) {
            throw new HttpError(403, 'You do not have permission to update this post picture');
        }

        await this.posts.updatePicture(id, pictureUrl);
        return await this.get(id, requester);
    }
}

module.exports = PostService;
