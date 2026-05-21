const express = require('express');
const router = express.Router();
const { submitPayment } = require('../../controllers/public/paymentController');

// POST /api/public/payments
router.post('/', submitPayment);

module.exports = router;