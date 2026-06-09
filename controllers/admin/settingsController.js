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
        maintenanceMessage: settings?.general?.maintenanceMessage || '',
        maintenanceStart: settings?.general?.maintenanceStart || null,
        maintenanceEnd: settings?.general?.maintenanceEnd || null,
        maintenanceSent: settings?.general?.maintenanceSent || false,
        maintenanceStartedSent: settings?.general?.maintenanceStartedSent || false,
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
    const { maintenanceMode, maintenanceMessage, maintenanceStart, maintenanceEnd, sendAnnouncement } = req.body;
    const settings = await SystemSettings.findOne();
    const oldMode = settings?.general?.maintenanceMode;

    // Send announcement email to all tenants
    if (sendAnnouncement && maintenanceStart && maintenanceEnd && !settings?.general?.maintenanceSent) {
      const Tenant = require('../../models/master/Tenant');
      const sendEmail = require('../../utils/sendEmail');
      const tenants = await Tenant.find({ status: 'active' });

      for (const tenant of tenants) {
        try {
          await sendEmail({
            to: tenant.contactEmail,
            toName: tenant.companyName,
            subject: `HDM ERP — Scheduled Maintenance: ${new Date(maintenanceStart).toLocaleDateString()}`,
            htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px;">
              <h2 style="color:#10B981;">Scheduled Maintenance Notice</h2>
              <p>Hello <strong>${tenant.companyName}</strong>,</p>
              <p>${maintenanceMessage}</p>
              <div style="background:#fef3c7;padding:15px;border-radius:8px;margin:15px 0;">
                <p><strong>Start:</strong> ${new Date(maintenanceStart).toLocaleString()}</p>
                <p><strong>End:</strong> ${new Date(maintenanceEnd).toLocaleString()}</p>
              </div>
              <p>The platform will be unavailable during this time. We apologize for any inconvenience.</p>
              <p style="color:#6b7280;font-size:12px;margin-top:20px;">— HDM ERP Team</p>
            </div>`,
          });
          await new Promise(r => setTimeout(r, 500));
        } catch (e) { logger.warn(`Maintenance announcement failed for ${tenant.companyName}:`, e.message); }
      }

      await SystemSettings.findOneAndUpdate({}, {
        $set: {
          'general.maintenanceSent': true,
          'general.maintenanceStartedSent': false,
          'general.maintenanceStart': maintenanceStart,
          'general.maintenanceEnd': maintenanceEnd,
          'general.maintenanceMessage': maintenanceMessage,
        }
      });
    }

    // If maintenance mode just turned ON, send "started" email
    if (maintenanceMode && !oldMode && !settings?.general?.maintenanceStartedSent) {
      const Tenant = require('../../models/master/Tenant');
      const sendEmail = require('../../utils/sendEmail');
      const tenants = await Tenant.find({ status: 'active' });

      for (const tenant of tenants) {
        try {
          await sendEmail({
            to: tenant.contactEmail,
            toName: tenant.companyName,
            subject: 'HDM ERP — Maintenance Started',
            htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px;">
              <h2 style="color:#f59e0b;">🔧 Maintenance In Progress</h2>
              <p>Hello <strong>${tenant.companyName}</strong>,</p>
              <p>HDM ERP is currently undergoing scheduled maintenance. The platform will be back shortly.</p>
              <p>We apologize for any inconvenience.</p>
              <p style="color:#6b7280;font-size:12px;margin-top:20px;">— HDM ERP Team</p>
            </div>`,
          });
          await new Promise(r => setTimeout(r, 500));
        } catch (e) { logger.warn(`Maintenance started email failed for ${tenant.companyName}:`, e.message); }
      }

      await SystemSettings.findOneAndUpdate({}, {
        $set: { 'general.maintenanceStartedSent': true, 'general.maintenanceMode': true }
      });
    }

    // If maintenance mode just turned OFF, send "completed" email
    if (!maintenanceMode && oldMode) {
      const Tenant = require('../../models/master/Tenant');
      const sendEmail = require('../../utils/sendEmail');
      const tenants = await Tenant.find({ status: 'active' });

      for (const tenant of tenants) {
        try {
          await sendEmail({
            to: tenant.contactEmail,
            toName: tenant.companyName,
            subject: 'HDM ERP — Maintenance Completed ✅',
            htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px;">
              <h2 style="color:#10B981;">✅ Maintenance Completed</h2>
              <p>Hello <strong>${tenant.companyName}</strong>,</p>
              <p>HDM ERP is now back online. All services have been restored.</p>
              <p>Thank you for your patience.</p>
              <a href="https://hdmerp.pxxl.click/login" style="display:inline-block;background:#10B981;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;margin:10px 0;">Login Now</a>
              <p style="color:#6b7280;font-size:12px;margin-top:20px;">— HDM ERP Team</p>
            </div>`,
          });
          await new Promise(r => setTimeout(r, 500));
        } catch (e) { logger.warn(`Maintenance completed email failed for ${tenant.companyName}:`, e.message); }
      }

      await SystemSettings.findOneAndUpdate({}, {
        $set: {
          'general.maintenanceMode': false,
          'general.maintenanceSent': false,
          'general.maintenanceStartedSent': false,
        }
      });
    }

    const updated = await SystemSettings.findOne();
    res.json({
      success: true,
      data: {
        maintenanceMode: updated?.general?.maintenanceMode || false,
        maintenanceMessage: updated?.general?.maintenanceMessage || '',
        maintenanceStart: updated?.general?.maintenanceStart || null,
        maintenanceEnd: updated?.general?.maintenanceEnd || null,
        maintenanceSent: updated?.general?.maintenanceSent || false,
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