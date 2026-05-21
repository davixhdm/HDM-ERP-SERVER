const express = require('express');
const router = express.Router();
const { getLegalDocument } = require('../../controllers/public/legalController');

// GET /api/public/legal/:type
router.get('/:type', getLegalDocument);

module.exports = router;