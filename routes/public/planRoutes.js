const express = require('express');
const router = express.Router();
const { getPlans } = require('../../controllers/public/planController');

// GET /api/public/plans
router.get('/', getPlans);

module.exports = router;