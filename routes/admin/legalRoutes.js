const express = require('express');
const router = express.Router();
const { getLegalDocument, updateLegalDocument } = require('../../controllers/admin/legalController');

// GET /api/admin/legal/:type
router.get('/:type', getLegalDocument);

// PUT /api/admin/legal/:type
router.put('/:type', updateLegalDocument);

module.exports = router;