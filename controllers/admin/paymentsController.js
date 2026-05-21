const SystemSettings = require('../../models/master/SystemSettings');
const logger = require('../../utils/logger');

/**
 * @desc    Get payment configuration
 * @route   GET /api/admin/payments
 * @access  Private (Super Admin)
 */
const getPaymentConfig = async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    res.json({ success: true, data: settings?.payments || {} });
  } catch (err) {
    logger.error('Get payment config error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Update payment configuration
 * @route   PUT /api/admin/payments
 * @access  Private (Super Admin)
 */
const updatePaymentConfig = async (req, res) => {
  try {
    const settings = await SystemSettings.findOneAndUpdate(
      {},
      { payments: req.body },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: settings.payments });
  } catch (err) {
    logger.error('Update payment config error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getPaymentConfig, updatePaymentConfig };