const Plan = require('../../models/master/Plan');
const Tenant = require('../../models/master/Tenant');
const SystemSettings = require('../../models/master/SystemSettings');
const logger = require('../../utils/logger');

/**
 * @desc    Register — step 1, validates and returns plan info
 * @route   POST /api/public/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { companyName, contactEmail, plan: planName, billingCycle } = req.body;

    const plan = await Plan.findOne({ name: planName, enabled: true });
    if (!plan) return res.status(400).json({ success: false, message: 'Invalid or disabled plan' });

    const existing = await Tenant.findOne({ contactEmail, status: 'active' });
    if (existing) return res.status(400).json({ success: false, message: 'A company with this email already exists' });

    const settings = await SystemSettings.findOne().select('payments.currency');
    const currency = settings?.payments?.currency || 'KSh';
    const cycle = billingCycle || 'monthly';
    const amountUSD = cycle === 'yearly' ? plan.pricing.yearly : cycle === 'permanent' ? plan.pricing.permanent : plan.pricing.monthly;

    res.json({
      success: true,
      message: 'Proceed to payment',
      data: { companyName, contactEmail, plan: planName, billingCycle: cycle, amount: amountUSD, currency: 'USD', displayCurrency: currency }
    });
  } catch (err) {
    logger.error('Registration error: ' + (err.message || err));
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { register };