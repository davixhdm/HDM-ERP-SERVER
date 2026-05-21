const express = require('express');
const router = express.Router();
const { getAIConfig, updateAIConfig } = require('../../controllers/admin/aiController');

// GET /api/admin/ai
router.get('/', getAIConfig);

// PUT /api/admin/ai
router.put('/', updateAIConfig);

module.exports = router;