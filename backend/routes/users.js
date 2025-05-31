const express = require('express');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getProfile,
  updateProfile,
  updateProfilePicture,
  searchUsers,
  getCurrentUser
} = require('../controllers/userController');

const router = express.Router();

router.get('/me', auth, getCurrentUser);
router.get('/search', auth, searchUsers);
router.get('/:userId', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.put('/profile-picture', auth, upload.single('profilePicture'), updateProfilePicture);

module.exports = router;