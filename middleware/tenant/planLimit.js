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

      // Check subscription expiry for paid plans
      if (tenant.plan !== 'free_trial' && tenant.subscriptionExpiry && tenant.subscriptionExpiry < new Date()) {
        return res.status(403).json({
          success: false,
          message: 'Your subscription has expired. Please renew to continue using HDM ERP.',
          code: 'SUBSCRIPTION_EXPIRED'
        });
      }

      // Check trial expiry for free trial
      if (tenant.plan === 'free_trial' && tenant.trialEndDate && tenant.trialEndDate < new Date()) {
        return res.status(403).json({
          success: false,
          message: 'Your free trial has ended. Please upgrade to a paid plan to continue.',
          code: 'TRIAL_EXPIRED'
        });
      }

      const plan = await Plan.findOne({ name: tenant.plan, enabled: true });
      if (!plan) {
        return res.status(403).json({ success: false, message: 'No active plan found.' });
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
        'crm': 'crm',
        'projects': 'projects',
        'assets': 'assets',
        'contacts': 'contacts',
        'products': 'products',
        'reports': 'reports',
        'communications': 'communications',
        'settings': 'settings',
        'dashboard': 'dashboard',
        'ai': 'aiSparkle',
        'ai-file-upload': 'aiFileUpload',
        'ai-outward-keys': 'outwardApiKeys'
      };

      const planKey = moduleMap[moduleName];

      // Check plan allows this module
      if (planKey && !plan.modules[planKey]) {
        logger.warn(`Module ${moduleName} blocked for tenant ${tenant._id} on plan ${tenant.plan}`);
        return res.status(403).json({
          success: false,
          message: `The ${moduleName} module is not available on your ${plan.displayName} plan. Please upgrade to access it.`,
          code: 'MODULE_NOT_IN_PLAN'
        });
      }

      // Check tenant hasn't disabled this module
      if (planKey && tenant.modules?.[planKey] === false) {
        return res.status(403).json({
          success: false,
          message: `The ${moduleName} module has been disabled for your company. Enable it in Settings → Modules.`,
          code: 'MODULE_DISABLED'
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