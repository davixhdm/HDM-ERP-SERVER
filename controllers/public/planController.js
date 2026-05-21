const Plan = require('../../models/master/Plan');
const SystemSettings = require('../../models/master/SystemSettings');
const { convert } = require('../../services/currencyService');
const logger = require('../../utils/logger');

const formatPrice = (num, currency) => {
  if (currency === 'KSh') return Math.round(num / 5) * 5;
  return Math.round(num * 100) / 100;
};

/**
 * @desc    Get public plan list with converted prices
 * @route   GET /api/public/plans
 * @access  Public
 */
const getPlans = async (req, res) => {
  try {
    const [plans, settings] = await Promise.all([
      Plan.find({ enabled: true }).sort({ sortOrder: 1 }).select('-__v'),
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
    logger.error('Get public plans error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getPlans };