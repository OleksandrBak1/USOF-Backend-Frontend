const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const multer = require('multer');
const HttpError = require('../errors/HttpError');

const UPLOADS_DIR = path.resolve(__dirname, '..', '..', '..', 'uploads', 'avatars');
const POSTS_UPLOADS_DIR = path.resolve(__dirname, '..', '..', '..', 'uploads', 'posts');

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

if (!fs.existsSync(POSTS_UPLOADS_DIR)) {
    fs.mkdirSync(POSTS_UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, UPLOADS_DIR);
    },
    filename(req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        const userId = req.user ? req.user.id : 'user';
        const unique = randomBytes(8).toString('hex');
        cb(null, `avatar-${userId}-${Date.now()}-${unique}${ext}`);
    }
});

const postStorage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, POSTS_UPLOADS_DIR);
    },
    filename(req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        const postId = req.params && req.params.post_id ? req.params.post_id : 'post';
        const unique = randomBytes(8).toString('hex');
        cb(null, `post-${postId}-${Date.now()}-${unique}${ext}`);
    }
});

const ALLOWED_MIMES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

function fileFilter(req, file, cb) {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
        return cb(new HttpError(400, 'Only image files (PNG, JPG, JPEG, WEBP) are allowed'), false);
    }
    cb(null, true);
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB
    }
});

const uploadPostPicture = multer({
    storage: postStorage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB
    }
});

module.exports = {
    upload,
    uploadAvatar: upload,
    uploadPostPicture,
    UPLOADS_DIR,
    POSTS_UPLOADS_DIR
};
