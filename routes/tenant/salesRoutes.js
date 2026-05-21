const express = require('express');
const router = express.Router();
const {
  getOrders, createOrder, updateOrderStatus,
  getQuotations, createQuotation,
  getPricing, updatePrice
} = require('../../controllers/tenant/salesController');

// Orders
router.get('/orders', getOrders);
router.post('/orders', createOrder);
router.put('/orders/:id/status', updateOrderStatus);

// Quotations
router.get('/quotations', getQuotations);
router.post('/quotations', createQuotation);

// Pricing
router.get('/pricing', getPricing);
router.put('/pricing/:id', updatePrice);

module.exports = router;