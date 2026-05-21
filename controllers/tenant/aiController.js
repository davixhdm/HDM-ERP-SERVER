const TenantAISettings = require('../../models/ai/TenantAISettings');
const OutwardAPIKey = require('../../models/ai/OutwardAPIKey');
const AIConfig = require('../../models/ai/AIConfig');
const { updateAISettingsSchema } = require('../../validators/tenant/aiValidator');
const cloudinaryService = require('../../services/cloudinaryService');
const logger = require('../../utils/logger');

const getAISettings = async (req, res) => {
  try {
    const Tenant = require('../../models/master/Tenant');
    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

    const [settings, aiConfig, plan] = await Promise.all([
      TenantAISettings.findOne({ tenantId: req.tenantId }),
      require('../../models/ai/AIConfig').findOne(),
      require('../../models/master/Plan').findOne({ name: tenant.plan })
    ]);

    const globalEnabled = aiConfig?.features?.clientAI !== false;
    const planAllows = plan?.modules?.aiSparkle === true;

    res.json({
      success: true,
      data: {
        keySource: settings?.keySource || 'hdm',
        moduleScopes: settings?.moduleScopes || [],
        enabled: globalEnabled && planAllows,
        globalEnabled,
        planAllows
      }
    });
  } catch (err) {
    logger.error('Get AI settings error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
const updateAISettings = async (req, res) => {
  try {
    const { error, value } = updateAISettingsSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const settings = await TenantAISettings.findOneAndUpdate(
      { tenantId: req.tenantId },
      value,
      { new: true, upsert: true }
    );
    res.json({ success: true, data: settings });
  } catch (err) {
    logger.error('Update AI settings error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const generateOutwardKey = async (req, res) => {
  try {
    const aiConfig = await AIConfig.findOne();
    if (!aiConfig || !aiConfig.features.outwardKeyGen) {
      return res.status(403).json({ success: false, message: 'Outward key generation has been disabled by the administrator.' });
    }
    const key = await OutwardAPIKey.create({
      tenantId: req.tenantId,
      name: req.body.name || 'API Key',
      scopes: req.body.scopes || [],
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: key });
  } catch (err) {
    logger.error('Generate outward key error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getOutwardKeys = async (req, res) => {
  try {
    const keys = await OutwardAPIKey.find({ tenantId: req.tenantId, isActive: true });
    res.json({ success: true, data: keys });
  } catch (err) {
    logger.error('Get outward keys error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const revokeOutwardKey = async (req, res) => {
  try {
    await OutwardAPIKey.findOneAndUpdate({ _id: req.params.id, tenantId: req.tenantId }, { isActive: false });
    res.json({ success: true, message: 'API key revoked' });
  } catch (err) {
    logger.error('Revoke outward key error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Upload file for AI analysis
 * @route   POST /api/tenant/ai/upload
 * @access  Private (Tenant)
 */
const uploadFile = async (req, res) => {
  try {
    const aiConfig = await AIConfig.findOne();
    if (!aiConfig || !aiConfig.features.fileUpload) {
      return res.status(403).json({ success: false, message: 'File upload for AI has been disabled by the administrator.' });
    }

    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const maxSize = (aiConfig.features.maxFileSizeMB || 5) * 1024 * 1024;
    if (req.file.size > maxSize) {
      return res.status(400).json({ success: false, message: `File too large. Maximum size is ${aiConfig.features.maxFileSizeMB}MB.` });
    }

    const result = await cloudinaryService.uploadFile(req.file.buffer, `tenant_ai/${req.tenantId}`);
    res.json({ success: true, data: { url: result.secure_url, publicId: result.public_id } });
  } catch (err) {
    logger.error('AI file upload error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getAISettings, updateAISettings, generateOutwardKey, getOutwardKeys, revokeOutwardKey, uploadFile };