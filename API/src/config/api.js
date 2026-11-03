const pool = require('./database');
const auth = require('./auth');
const UserRepository = require('../models/UserRepository');
const CategoryRepository = require('../models/CategoryRepository');
const PasswordService = require('../services/PasswordService');
const UserService = require('../services/UserService');
const CategoryService = require('../services/CategoryService');
const UserController = require('../controllers/UserController');
const CategoryController = require('../controllers/CategoryController');

const PostRepository = require('../models/PostRepository');
const PostService = require('../services/PostService');
const PostController = require('../controllers/PostController');
const CommentRepository = require('../models/CommentRepository');
const CommentService = require('../services/CommentService');
const CommentController = require('../controllers/CommentController');
const LikeRepository = require('../models/LikeRepository');
const LikeService = require('../services/LikeService');
const LikeController = require('../controllers/LikeController');
const FavoriteRepository = require('../models/FavoriteRepository');
const SubscriptionRepository = require('../models/SubscriptionRepository');
const CreativeService = require('../services/CreativeService');
const CreativeController = require('../controllers/CreativeController');
const EmailService = require('../services/EmailService');

function createApi(database = pool, authentication = auth.createAuth(database), emailService = new EmailService()) {
    const categoryRepo = new CategoryRepository(database);
    const postRepo = new PostRepository(database);
    const postService = new PostService(postRepo, categoryRepo);
    const postController = new PostController(postService);

    const favoriteRepo = new FavoriteRepository(database);
    const subscriptionRepo = new SubscriptionRepository(database);
    const creativeService = new CreativeService(favoriteRepo, subscriptionRepo, postRepo, emailService);
    const creativeController = new CreativeController(creativeService);

    const commentRepo = new CommentRepository(database);
    const commentService = new CommentService(commentRepo, postRepo, creativeService);
    const commentController = new CommentController(commentService);

    const likeRepo = new LikeRepository(database);
    const likeService = new LikeService(likeRepo, postRepo, commentRepo);
    const likeController = new LikeController(likeService);

    return {
        auth: authentication,
        users: new UserController(new UserService(new UserRepository(database), new PasswordService(), emailService)),
        categories: new CategoryController(new CategoryService(categoryRepo)),
        posts: postController,
        comments: commentController,
        likes: likeController,
        creative: creativeController
    };
}

module.exports = { createApi, ...createApi(pool, auth) };
