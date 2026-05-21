const express = require('express');
const router = express.Router();
const { stripeWebhook, mpesaWebhook } = require('../../controllers/public/webhookController');

// Stripe requires raw body, handled in server.js; here we just define the endpoint
router.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhook);
router.post('/mpesa', express.json(), mpesaWebhook);

module.exports = router;