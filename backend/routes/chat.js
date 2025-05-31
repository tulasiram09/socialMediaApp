const express = require('express');
const auth = require('../middleware/auth');
const {
  createChat,
  getChats,
  getChatMessages,
  sendMessage
} = require('../controllers/chatController');

const router = express.Router();

router.post('/', auth, createChat);
router.get('/', auth, getChats);
router.get('/:chatId', auth, getChatMessages);
router.post('/message', auth, sendMessage);

module.exports = router;