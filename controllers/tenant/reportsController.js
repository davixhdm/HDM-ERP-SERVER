const Report = require('../../models/tenant/Report');
const logger = require('../../utils/logger');

/**
 * @desc    Get saved reports
 * @route   GET /api/tenant/reports
 * @access  Private (Tenant)
 */
const getReports = async (req, res) => {
  try {
    const reports = await Report.find({ tenantId: req.tenantId });
    res.json({ success: true, data: reports });
  } catch (err) {
    logger.error('Get reports error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Save a report
 * @route   POST /api/tenant/reports
 * @access  Private (Tenant)
 */
const saveReport = async (req, res) => {
  try {
    const report = await Report.create({ tenantId: req.tenantId, ...req.body });
    res.status(201).json({ success: true, data: report });
  } catch (err) {
    logger.error('Save report error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Run report engine (simple stub)
 * @route   GET /api/tenant/reports/engine/:id
 * @access  Private (Tenant)
 */
const runReport = async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    let data = [];

    switch (report.module) {
      case 'finance': {
        const invoices = await require('../../models/tenant/Invoice').find({ tenantId: req.tenantId }).lean();
        const bills = await require('../../models/tenant/Bill').find({ tenantId: req.tenantId }).lean();
        data = {
          totalInvoices: invoices.length,
          totalBilled: invoices.reduce((s, i) => s + (i.grandTotal || 0), 0),
          totalBills: bills.length,
          totalOwed: bills.reduce((s, b) => s + (b.grandTotal || 0), 0),
          invoices,
          bills
        };
        break;
      }
      case 'hr': {
        const employees = await require('../../models/tenant/Employee').find({ tenantId: req.tenantId }).lean();
        data = { totalEmployees: employees.length, employees };
        break;
      }
      case 'sales': {
        const orders = await require('../../models/tenant/SalesOrder').find({ tenantId: req.tenantId }).lean();
        data = { totalOrders: orders.length, totalValue: orders.reduce((s, o) => s + (o.grandTotal || 0), 0), orders };
        break;
      }
      case 'inventory': {
        const products = await require('../../models/tenant/Product').find({ tenantId: req.tenantId }).lean();
        data = { totalProducts: products.length, totalStock: products.reduce((s, p) => s + (p.stock || 0), 0), products };
        break;
      }
      case 'supply_chain': {
        const pos = await require('../../models/tenant/PurchaseOrder').find({ tenantId: req.tenantId }).lean();
        data = { totalPOs: pos.length, totalValue: pos.reduce((s, po) => s + (po.grandTotal || 0), 0), pos };
        break;
      }
      case 'manufacturing': {
        const wos = await require('../../models/tenant/WorkOrder').find({ tenantId: req.tenantId }).lean();
        data = { totalWorkOrders: wos.length, completed: wos.filter(w => w.status === 'completed').length, wos };
        break;
      }
      case 'all': {
        const [invoices, bills, employees, orders, products] = await Promise.all([
          require('../../models/tenant/Invoice').find({ tenantId: req.tenantId }).lean(),
          require('../../models/tenant/Bill').find({ tenantId: req.tenantId }).lean(),
          require('../../models/tenant/Employee').find({ tenantId: req.tenantId }).lean(),
          require('../../models/tenant/SalesOrder').find({ tenantId: req.tenantId }).lean(),
          require('../../models/tenant/Product').find({ tenantId: req.tenantId }).lean(),
        ]);
        data = {
          finance: { invoices: invoices.length, bills: bills.length },
          hr: { employees: employees.length },
          sales: { orders: orders.length },
          inventory: { products: products.length, stock: products.reduce((s, p) => s + (p.stock || 0), 0) },
        };
        break;
      }
      default:
        data = { message: 'No data available for this module' };
    }

    res.json({ success: true, data });
  } catch (err) {
    logger.error('Run report error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Delete report
 * @route   DELETE /api/tenant/reports/:id
 * @access  Private (Tenant)
 */
const deleteReport = async (req, res) => {
  try {
    await Report.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    res.json({ success: true, message: 'Report deleted' });
  } catch (err) {
    logger.error('Delete report error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getReports, saveReport, runReport, deleteReport };