const express = require('express');
const publicRoutes = require('./public');
const adminRoutes = require('./admin');
const tenantRoutes = require('./tenant');

const router = express.Router();

// Mount route groups
router.use('/public', publicRoutes);
router.use('/admin', adminRoutes);
router.use('/tenant', tenantRoutes);

// Webhooks (no prefix needed)
router.use('/webhooks', require('./public/webhookRoutes'));

module.exports = router;