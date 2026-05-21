const SystemSettings = require('../../models/master/SystemSettings');
const { generalSettingsSchema, brandingSettingsSchema, landingSettingsSchema, uploadsSettingsSchema } = require('../../validators/admin/settingsValidator');
const logger = require('../../utils/logger');

const getGeneralSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    res.json({ success: true, data: settings?.general || {} });
  } catch (err) {
    logger.error('Get general settings error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateGeneralSettings = async (req, res) => {
  try {
    const { error, value } = generalSettingsSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });
    const settings = await SystemSettings.findOneAndUpdate({}, { general: value }, { new: true, upsert: true });
    res.json({ success: true, data: settings.general });
  } catch (err) {
    logger.error('Update general settings error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getBrandingSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    res.json({ success: true, data: settings?.branding || {} });
  } catch (err) {
    logger.error('Get branding settings error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateBrandingSettings = async (req, res) => {
  try {
    const { error, value } = brandingSettingsSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });
    const settings = await SystemSettings.findOneAndUpdate({}, { branding: value }, { new: true, upsert: true });
    res.json({ success: true, data: settings.branding });
  } catch (err) {
    logger.error('Update branding settings error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getLandingSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    res.json({ success: true, data: settings?.landingPage || {} });
  } catch (err) {
    logger.error('Get landing settings error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateLandingSettings = async (req, res) => {
  try {
    const { error, value } = landingSettingsSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });
    const settings = await SystemSettings.findOneAndUpdate({}, { landingPage: value }, { new: true, upsert: true });
    res.json({ success: true, data: settings.landingPage });
  } catch (err) {
    logger.error('Update landing settings error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getUploadsSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    res.json({ success: true, data: settings?.uploads || {} });
  } catch (err) {
    logger.error('Get uploads settings error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateUploadsSettings = async (req, res) => {
  try {
    const { error, value } = uploadsSettingsSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });
    const settings = await SystemSettings.findOneAndUpdate({}, { uploads: value }, { new: true, upsert: true });
    res.json({ success: true, data: settings.uploads });
  } catch (err) {
    logger.error('Update uploads settings error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getDownloadsSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    res.json({ success: true, data: settings?.downloads || {} });
  } catch (err) {
    logger.error('Get downloads settings error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateDownloadsSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.findOneAndUpdate({}, { downloads: req.body }, { new: true, upsert: true });
    res.json({ success: true, data: settings.downloads });
  } catch (err) {
    logger.error('Update downloads settings error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Get maintenance settings
 * @route   GET /api/admin/settings/maintenance
 * @access  Private (Super Admin)
 */
const getMaintenanceSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    res.json({
      success: true,
      data: {
        maintenanceMode: settings?.general?.maintenanceMode || false,
        maintenanceMessage: settings?.general?.maintenanceMessage || ''
      }
    });
  } catch (err) {
    logger.error('Get maintenance error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Update maintenance settings
 * @route   PUT /api/admin/settings/maintenance
 * @access  Private (Super Admin)
 */
const updateMaintenanceSettings = async (req, res) => {
  try {
    const { maintenanceMode, maintenanceMessage } = req.body;
    const settings = await SystemSettings.findOneAndUpdate(
      {},
      { $set: { 'general.maintenanceMode': maintenanceMode, 'general.maintenanceMessage': maintenanceMessage } },
      { new: true, upsert: true }
    );
    res.json({
      success: true,
      data: {
        maintenanceMode: settings.general.maintenanceMode,
        maintenanceMessage: settings.general.maintenanceMessage
      }
    });
  } catch (err) {
    logger.error('Update maintenance error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getGeneralSettings, updateGeneralSettings,
  getBrandingSettings, updateBrandingSettings,
  getLandingSettings, updateLandingSettings,
  getUploadsSettings, updateUploadsSettings,
  getDownloadsSettings, updateDownloadsSettings,
  getMaintenanceSettings, updateMaintenanceSettings
};