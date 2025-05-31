const express = require('express');
const auth = require('../middleware/auth');
const {
  sendFriendRequest,
  getFriendRequests,
  handleFriendRequest,
  getFriends
} = require('../controllers/friendController');

const router = express.Router();

router.post('/request', auth, sendFriendRequest);
router.get('/requests', auth, getFriendRequests);
router.put('/request/:requestId', auth, handleFriendRequest);
router.get('/', auth, getFriends);

module.exports = router;