const SalesOrder = require('../../models/tenant/SalesOrder');
const PurchaseOrder = require('../../models/tenant/PurchaseOrder');
const WorkOrder = require('../../models/tenant/WorkOrder');
const logger = require('../../utils/logger');

/**
 * @desc    Get unified order view (all types)
 * @route   GET /api/tenant/orders
 * @access  Private (Tenant)
 */
const getUnifiedOrders = async (req, res) => {
  try {
    const type = req.query.type;
    let sales = [], purchases = [], work = [];
    if (!type || type === 'sales') sales = await SalesOrder.find({ tenantId: req.tenantId }).lean();
    if (!type || type === 'purchase') purchases = await PurchaseOrder.find({ tenantId: req.tenantId }).lean();
    if (!type || type === 'work') work = await WorkOrder.find({ tenantId: req.tenantId }).lean();

    const orders = [
      ...sales.map(o => ({ ...o, orderType: 'sales' })),
      ...purchases.map(o => ({ ...o, orderType: 'purchase' })),
      ...work.map(o => ({ ...o, orderType: 'work' }))
    ];
    res.json({ success: true, data: orders });
  } catch (err) {
    logger.error('Get unified orders error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getUnifiedOrders };