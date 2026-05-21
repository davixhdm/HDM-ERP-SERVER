const Invoice = require('../../models/tenant/Invoice');
const SalesOrder = require('../../models/tenant/SalesOrder');
const Product = require('../../models/tenant/Product');
const Contact = require('../../models/tenant/Contact');
const logger = require('../../utils/logger');

/**
 * @desc    Get dashboard metrics
 * @route   GET /api/tenant/dashboard
 * @access  Private (Tenant)
 */
const getMetrics = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const [
      totalCustomers,
      openInvoices,
      revenueAgg,
      lowStockCount,
      recentOrders,
      totalRevenue,
      totalExpenses
    ] = await Promise.all([
      Contact.countDocuments({ tenantId, type: 'customer', isActive: true }),
      Invoice.find({ tenantId, status: { $in: ['draft', 'sent'] } }).lean(),
      Invoice.aggregate([
        { $match: { tenantId, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } }
      ]),
      Product.countDocuments({ tenantId, isActive: true, $expr: { $lte: ['$stock', '$reorderLevel'] } }),
      SalesOrder.find({ tenantId }).sort({ createdAt: -1 }).limit(5).lean(),
      require('../../models/tenant/Payment').aggregate([
        { $match: { tenantId, type: 'income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      require('../../models/tenant/Payment').aggregate([
        { $match: { tenantId, type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const openInvoicesTotal = openInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

    res.json({
      success: true,
      data: {
        totalCustomers,
        openInvoices: { count: openInvoices.length, total: openInvoicesTotal },
        revenue: revenueAgg[0]?.total || 0,
        lowStockItems: lowStockCount,
        cashFlow: {
          income: totalRevenue[0]?.total || 0,
          expenses: totalExpenses[0]?.total || 0
        },
        recentOrders
      }
    });
  } catch (err) {
    logger.error('Dashboard error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getMetrics };