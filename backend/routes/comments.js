const express = require('express');
const auth = require('../middleware/auth');
const {
  createComment,
  getComments
} = require('../controllers/commentController');

const router = express.Router();

router.post('/', auth, createComment);
router.get('/:postId', auth, getComments);

module.exports = router;