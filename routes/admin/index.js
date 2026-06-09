const express = require('express');
const router = express.Router();
const superAdminAuth = require('../../middleware/admin/superAdmin');

router.use('/auth', require('./authRoutes'));
router.use(superAdminAuth);
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/tenants', require('./tenantsRoutes'));
router.use('/approvals', require('./approvalsRoutes'));
router.use('/plans', require('./plansRoutes'));
router.use('/settings', require('./settingsRoutes'));
router.use('/payments', require('./paymentsRoutes'));
router.use('/ai', require('./aiRoutes'));
router.use('/uploads', require('./uploadsRoutes'));
router.use('/legal', require('./legalRoutes'));
router.use('/backups', require('./backupRoutes'));
router.use('/email', require('./emailRoutes'));

module.exports = router;