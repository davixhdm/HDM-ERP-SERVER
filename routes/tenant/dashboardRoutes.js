const express = require('express');
const router = express.Router();
const { getMetrics } = require('../../controllers/tenant/dashboardController');

// GET /api/tenant/dashboard
router.get('/', getMetrics);

module.exports = router;