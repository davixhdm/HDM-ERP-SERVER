const express = require('express');
const router = express.Router();
const {
  getGeneralSettings, updateGeneralSettings,
  getBrandingSettings, updateBrandingSettings,
  getLandingSettings, updateLandingSettings,
  getUploadsSettings, updateUploadsSettings,
  getDownloadsSettings, updateDownloadsSettings,
  getMaintenanceSettings, updateMaintenanceSettings
} = require('../../controllers/admin/settingsController');

// General
router.get('/general', getGeneralSettings);
router.put('/general', updateGeneralSettings);

// Branding
router.get('/branding', getBrandingSettings);
router.put('/branding', updateBrandingSettings);

// Landing Page
router.get('/landing', getLandingSettings);
router.put('/landing', updateLandingSettings);

// Uploads
router.get('/uploads', getUploadsSettings);
router.put('/uploads', updateUploadsSettings);

// Downloads
router.get('/downloads', getDownloadsSettings);
router.put('/downloads', updateDownloadsSettings);

// Maintenance
router.get('/maintenance', getMaintenanceSettings);
router.put('/maintenance', updateMaintenanceSettings);

module.exports = router;