const express = require('express');
const router = express.Router();
const tenantAuth = require('../../middleware/tenant/auth');
const tenantResolver = require('../../middleware/tenant/tenant');
const { planLimit } = require('../../middleware/tenant/planLimit');
const companyAdminAuth = require('../../middleware/tenant/companyAdmin');

// All tenant routes require authentication and tenant resolution
router.use(tenantAuth);
router.use(tenantResolver);

// Mount individual modules
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/company', require('./companyRoutes'));
router.use('/users', require('./usersRoutes'));
router.use('/finance', planLimit('finance'), require('./financeRoutes'));
router.use('/hr', planLimit('hr'), require('./hrRoutes'));
router.use('/sales', planLimit('sales'), require('./salesRoutes'));
router.use('/inventory', planLimit('inventory'), require('./inventoryRoutes'));
router.use('/supply-chain', planLimit('supplyChain'), require('./supplyChainRoutes'));
router.use('/orders', planLimit('orders'), require('./ordersRoutes'));
router.use('/manufacturing', planLimit('manufacturing'), require('./manufacturingRoutes'));
router.use('/contacts', planLimit('contacts'), require('./contactsRoutes'));
router.use('/products', planLimit('products'), require('./productsRoutes'));
router.use('/reports', planLimit('reports'), require('./reportsRoutes'));
router.use('/billing', require('./billingRoutes'));
router.use('/security', require('./securityRoutes'));
router.use('/ai', require('./aiRoutes'));
router.use('/ai/query', require('./aiQueryRoutes'));
router.use('/backups', require('./backupRoutes'));

module.exports = router;