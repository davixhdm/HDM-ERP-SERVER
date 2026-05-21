const express = require('express');
const router = express.Router();
const { getPaymentConfig, updatePaymentConfig } = require('../../controllers/admin/paymentsController');

// GET /api/admin/payments
router.get('/', getPaymentConfig);

// PUT /api/admin/payments
router.put('/', updatePaymentConfig);

module.exports = router;