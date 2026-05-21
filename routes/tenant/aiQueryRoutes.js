const express = require('express');
const router = express.Router();
const { queryAI } = require('../../controllers/tenant/aiQueryController');
const aiInternalAuth = require('../../middleware/tenant/aiAuth');
const { aiLimiter } = require('../../middleware/public/rateLimiter');

// POST /api/tenant/ai/query
router.post('/', aiLimiter, aiInternalAuth, queryAI);

module.exports = router;