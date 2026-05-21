const express = require('express');
const router = express.Router();
const { getUnifiedOrders } = require('../../controllers/tenant/ordersController');

// GET /api/tenant/orders (unified view)
router.get('/', getUnifiedOrders);

module.exports = router;