const Plan = require('../../models/master/Plan');
const Tenant = require('../../models/master/Tenant');
const logger = require('../../utils/logger');

const planLimit = (moduleName) => {
  return async (req, res, next) => {
    try {
      if (!req.tenantId) {
        return res.status(400).json({ success: false, message: 'Tenant not resolved.' });
      }

      const tenant = req.tenant || await Tenant.findById(req.tenantId);
      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Tenant not found.' });
      }

      const plan = await Plan.findOne({ name: tenant.plan, enabled: true });
      if (!plan) {
        return res.status(403).json({ success: false, message: 'No active plan found.' });
      }

      // Check subscription expiry
      if (tenant.subscriptionExpiry && tenant.subscriptionExpiry < new Date()) {
        return res.status(403).json({ success: false, message: 'Subscription has expired. Please renew.' });
      }

      // Map module names to plan module keys
      const moduleMap = {
        'finance': 'finance',
        'hr': 'hr',
        'sales': 'sales',
        'inventory': 'inventory',
        'supply-chain': 'supplyChain',
        'supplyChain': 'supplyChain',
        'orders': 'orders',
        'manufacturing': 'manufacturing',
        'contacts': 'contacts',
        'products': 'products',
        'reports': 'reports',
        'settings': 'settings',
        'dashboard': 'dashboard',
        'ai': 'aiSparkle',
        'ai-file-upload': 'aiFileUpload',
        'ai-outward-keys': 'outwardApiKeys'
      };

      const planKey = moduleMap[moduleName];
      if (planKey && !plan.modules[planKey]) {
        logger.warn(`Module ${moduleName} blocked for tenant ${tenant._id} on plan ${tenant.plan}`);
        return res.status(403).json({
          success: false,
          message: `The ${moduleName} module is not available on your current plan. Please upgrade.`
        });
      }

      // Attach plan limits to request for controllers
      req.planLimits = plan.limits;
      next();
    } catch (err) {
      logger.error(`Plan limit middleware error: ${err.message}`);
      return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  };
};

// Check specific limits
const checkUserLimit = async (req, res, next) => {
  try {
    const User = require('../../models/tenant/User');
    const userCount = await User.countDocuments({ tenantId: req.tenantId, isActive: true });
    const maxUsers = req.planLimits?.maxUsers || 3;

    if (userCount >= maxUsers) {
      return res.status(403).json({
        success: false,
        message: `User limit reached (${maxUsers}). Please upgrade your plan.`
      });
    }
    next();
  } catch (err) {
    logger.error(`User limit check error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const checkAIWriteAccess = async (req, res, next) => {
  try {
    if (!req.planLimits?.aiWrite) {
      return res.status(403).json({
        success: false,
        message: 'AI write access is not available on your plan. Please upgrade.'
      });
    }
    next();
  } catch (err) {
    logger.error(`AI write check error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const checkOutwardKeyLimit = async (req, res, next) => {
  try {
    const OutwardAPIKey = require('../../models/ai/OutwardAPIKey');
    const keyCount = await OutwardAPIKey.countDocuments({ tenantId: req.tenantId, isActive: true });
    const maxKeys = req.planLimits?.aiOutwardKeys || 0;

    if (keyCount >= maxKeys) {
      return res.status(403).json({
        success: false,
        message: `Outward API key limit reached (${maxKeys}). Please upgrade your plan.`
      });
    }
    next();
  } catch (err) {
    logger.error(`Outward key limit check error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const checkReportLimit = async (req, res, next) => {
  try {
    const Report = require('../../models/tenant/Report');
    const reportCount = await Report.countDocuments({ tenantId: req.tenantId, isSystem: false });
    const maxReports = req.planLimits?.maxCustomReports || 3;

    if (reportCount >= maxReports) {
      return res.status(403).json({
        success: false,
        message: `Custom report limit reached (${maxReports}). Please upgrade your plan.`
      });
    }
    next();
  } catch (err) {
    logger.error(`Report limit check error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { planLimit, checkUserLimit, checkAIWriteAccess, checkOutwardKeyLimit, checkReportLimit };