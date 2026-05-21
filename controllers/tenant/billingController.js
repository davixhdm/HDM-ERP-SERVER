const Tenant = require('../../models/master/Tenant');
const Plan = require('../../models/master/Plan');
const Subscription = require('../../models/master/Subscription');
const logger = require('../../utils/logger');

/**
 * @desc    Get billing overview
 * @route   GET /api/tenant/billing
 * @access  Private (Tenant)
 */
const getBilling = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId);
    const plan = await Plan.findOne({ name: tenant.plan });
    res.json({ success: true, data: { currentPlan: tenant.plan, status: tenant.status, subscriptionExpiry: tenant.subscriptionExpiry, planDetails: plan } });
  } catch (err) {
    logger.error('Get billing error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Upgrade plan
 * @route   POST /api/tenant/billing/upgrade
 * @access  Private (Company Admin)
 */
const upgradePlan = async (req, res) => {
  try {
    const { plan: newPlan, billingCycle } = req.body;
    const plan = await Plan.findOne({ name: newPlan, enabled: true });
    if (!plan) return res.status(400).json({ success: false, message: 'Invalid plan' });

    // In production, create Stripe session or payment link; stub here
    const tenant = await Tenant.findByIdAndUpdate(req.tenantId, { plan: newPlan }, { new: true });
    res.json({ success: true, message: `Upgraded to ${newPlan}`, data: tenant });
  } catch (err) {
    logger.error('Upgrade plan error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getBilling, upgradePlan };