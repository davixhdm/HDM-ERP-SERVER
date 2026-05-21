const Tenant = require('../../models/master/Tenant');
const PendingActivation = require('../../models/master/PendingActivation');
const LicenseKey = require('../../models/master/LicenseKey');
const AIUsageLog = require('../../models/ai/AIUsageLog');
const logger = require('../../utils/logger');

/**
 * @desc    Get admin dashboard stats
 * @route   GET /api/admin/dashboard
 * @access  Private (Super Admin)
 */
const getStats = async (req, res) => {
  try {
    const [totalTenants, activeTenants, pendingApprovals, activeKeys, aiUsage] = await Promise.all([
      Tenant.countDocuments(),
      Tenant.countDocuments({ status: 'active' }),
      PendingActivation.countDocuments({ status: 'pending' }),
      LicenseKey.countDocuments({ isActive: true }),
      AIUsageLog.aggregate([
        { $group: { _id: null, totalTokens: { $sum: '$tokensUsed' }, totalRequests: { $sum: 1 } } }
      ])
    ]);
    res.json({
      success: true,
      data: {
        totalTenants,
        activeTenants,
        pendingApprovals,
        activeLicenseKeys: activeKeys,
        aiUsage: aiUsage[0] || { totalTokens: 0, totalRequests: 0 }
      }
    });
  } catch (err) {
    logger.error('Admin dashboard error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getStats };