const express = require('express');
const router = express.Router();
const { chat, getChatbotConfig } = require('../../controllers/public/aiChatController');
const { aiLimiter } = require('../../middleware/public/rateLimiter');

router.get('/config', getChatbotConfig);
router.post('/', aiLimiter, chat);

module.exports = router;