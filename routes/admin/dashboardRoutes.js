const express = require('express');
const router = express.Router();
const { getStats } = require('../../controllers/admin/dashboardController');

// GET /api/admin/dashboard
router.get('/', getStats);

module.exports = router;