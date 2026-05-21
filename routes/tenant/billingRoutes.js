const express = require('express');
const router = express.Router();
const { getBilling, upgradePlan } = require('../../controllers/tenant/billingController');
const companyAdminAuth = require('../../middleware/tenant/companyAdmin');

// GET /api/tenant/billing
router.get('/', getBilling);

// POST /api/tenant/billing/upgrade (admin only)
router.post('/upgrade', companyAdminAuth, upgradePlan);

module.exports = router;