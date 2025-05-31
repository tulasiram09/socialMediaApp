const express = require('express');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createPost,
  getPosts,
  getUserPosts,
  likePost
} = require('../controllers/postController');

const router = express.Router();

router.post('/', auth, upload.single('image'), createPost);
router.get('/', auth, getPosts);
router.get('/user/:userId', auth, getUserPosts);
router.post('/:postId/like', auth, likePost);

module.exports = router;