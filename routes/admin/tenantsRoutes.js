const express = require('express');
const router = express.Router();
const { getTenants, getTenantDetail, suspendTenant, deleteTenant } = require('../../controllers/admin/tenantsController');

// GET /api/admin/tenants
router.get('/', getTenants);

// GET /api/admin/tenants/:id
router.get('/:id', getTenantDetail);

// PUT /api/admin/tenants/:id/suspend
router.put('/:id/suspend', suspendTenant);

// DELETE /api/admin/tenants/:id
router.delete('/:id', deleteTenant);

module.exports = router;