const Plan = require('../../models/master/Plan');
const SystemSettings = require('../../models/master/SystemSettings');
const { convert } = require('../../services/currencyService');
const { planSchema } = require('../../validators/admin/plansValidator');
const logger = require('../../utils/logger');

const formatPrice = (num, currency) => {
  if (currency === 'KSh') return Math.round(num / 5) * 5;
  return Math.round(num * 100) / 100;
};

/**
 * @desc    Get all plans with converted prices
 * @route   GET /api/admin/plans
 * @access  Private (Super Admin)
 */
const getPlans = async (req, res) => {
  try {
    const [plans, settings] = await Promise.all([
      Plan.find().sort({ sortOrder: 1 }),
      SystemSettings.findOne().select('payments.currency')
    ]);

    const currency = settings?.payments?.currency || 'KSh';

    const convertedPlans = plans.map(plan => {
      const obj = plan.toObject();
      obj.pricing = {
        monthly: formatPrice(convert(obj.pricing.monthly, 'USD', currency), currency),
        yearly: formatPrice(convert(obj.pricing.yearly, 'USD', currency), currency),
        permanent: formatPrice(convert(obj.pricing.permanent, 'USD', currency), currency),
        stripePriceId: obj.pricing.stripePriceId || ''
      };
      obj.displayCurrency = currency;
      return obj;
    });

    res.json({
      success: true,
      currency,
      data: convertedPlans
    });
  } catch (err) {
    logger.error('Get plans error:', err.message || err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Create a plan
 * @route   POST /api/admin/plans
 * @access  Private (Super Admin)
 */
const createPlan = async (req, res) => {
  try {
    const { error, value } = planSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const existing = await Plan.findOne({ name: value.name });
    if (existing) return res.status(400).json({ success: false, message: 'Plan already exists' });

    const plan = await Plan.create(value);
    res.status(201).json({ success: true, data: plan });
  } catch (err) {
    logger.error('Create plan error:', err.message || err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Update a plan
 * @route   PUT /api/admin/plans/:id
 * @access  Private (Super Admin)
 */
const updatePlan = async (req, res) => {
  try {
    const { error, value } = planSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const plan = await Plan.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, data: plan });
  } catch (err) {
    logger.error('Update plan error:', err.message || err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Delete a plan
 * @route   DELETE /api/admin/plans/:id
 * @access  Private (Super Admin)
 */
const deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, message: 'Plan deleted' });
  } catch (err) {
    logger.error('Delete plan error:', err.message || err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getPlans, createPlan, updatePlan, deletePlan };