const logger = require('../../utils/logger');
const Tenant = require('../../models/master/Tenant');
const Plan = require('../../models/master/Plan');
const AIConfig = require('../../models/ai/AIConfig');

const aiInternalAuth = async (req, res, next) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant not resolved.' });
    }

    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant || tenant.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Tenant not active.' });
    }

    const plan = await Plan.findOne({ name: tenant.plan });
    if (!plan || !plan.modules.aiSparkle) {
      return res.status(403).json({ success: false, message: 'AI is not available on your plan.' });
    }

    // Check global AI toggle
    const aiConfig = await AIConfig.findOne();
    if (!aiConfig || !aiConfig.features.clientAI) {
      return res.status(403).json({ success: false, message: 'AI has been disabled by the administrator.' });
    }

    next();
  } catch (err) {
    logger.error('AI auth middleware error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = aiInternalAuth;