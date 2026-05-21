const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, getModules, toggleModules } = require('../../controllers/tenant/companyController');
const companyAdminAuth = require('../../middleware/tenant/companyAdmin');

// GET /api/tenant/company
router.get('/', getSettings);

// PUT /api/tenant/company (company admin only)
router.put('/', companyAdminAuth, updateSettings);

// GET /api/tenant/company/modules
router.get('/modules', getModules);

// PUT /api/tenant/company/modules/toggle (company admin only)
router.put('/modules/toggle', companyAdminAuth, toggleModules);

module.exports = router;