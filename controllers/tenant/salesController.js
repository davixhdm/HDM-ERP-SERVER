const SalesOrder = require('../../models/tenant/SalesOrder');
const Quotation = require('../../models/tenant/SalesOrder'); // using same model for quotations as they share structure
const Product = require('../../models/tenant/Product');
const logger = require('../../utils/logger');

/**
 * @desc    Get sales orders
 * @route   GET /api/tenant/sales/orders
 * @access  Private (Tenant)
 */
const getOrders = async (req, res) => {
  try {
    const orders = await SalesOrder.find({ tenantId: req.tenantId }).sort({ createdAt: -1 }).populate('customer');
    res.json({ success: true, data: orders });
  } catch (err) {
    logger.error('Get sales orders error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Create sales order
 * @route   POST /api/tenant/sales/orders
 * @access  Private (Tenant)
 */
const createOrder = async (req, res) => {
  try {
    const { customer, customerName, orderDate, items, notes } = req.body;
    const orderNumber = `SO-${Date.now()}`;
    const computedItems = items.map(item => ({
      ...item,
      total: item.quantity * item.unitPrice - (item.discount || 0)
    }));
    const subtotal = computedItems.reduce((s, i) => s + i.total, 0);
    const discountTotal = computedItems.reduce((s, i) => s + (i.discount || 0), 0);
    const taxTotal = computedItems.reduce((s, i) => s + (i.total * (i.taxRate || 0) / 100), 0);
    const grandTotal = subtotal - discountTotal + taxTotal;

    const order = await SalesOrder.create({
      tenantId: req.tenantId,
      orderNumber,
      customer: customer || null,
      customerName: customerName || '',
      orderDate,
      items: computedItems,
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal,
      status: 'draft',
      notes,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    console.error('CREATE ORDER ERROR:', err);
    logger.error('Create sales order error: ' + (err.message || JSON.stringify(err)));
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Update sales order status
 * @route   PUT /api/tenant/sales/orders/:id/status
 * @access  Private (Tenant)
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await SalesOrder.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    logger.error('Update order status error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Get quotations
 * @route   GET /api/tenant/sales/quotations
 * @access  Private (Tenant)
 */
const getQuotations = async (req, res) => {
  try {
    const quotations = await SalesOrder.find({ tenantId: req.tenantId, status: { $in: ['draft', 'sent', 'accepted', 'declined'] } }).sort({ createdAt: -1 });
    res.json({ success: true, data: quotations });
  } catch (err) {
    logger.error('Get quotations error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Create quotation
 * @route   POST /api/tenant/sales/quotations
 * @access  Private (Tenant)
 */
const createQuotation = async (req, res) => {
  try {
    const quotation = await SalesOrder.create({
      tenantId: req.tenantId,
      ...req.body,
      orderNumber: `Q-${Date.now()}`,
      status: 'draft'
    });
    res.status(201).json({ success: true, data: quotation });
  } catch (err) {
    logger.error('Create quotation error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Get product pricing
 * @route   GET /api/tenant/sales/pricing
 * @access  Private (Tenant)
 */
const getPricing = async (req, res) => {
  try {
    const products = await Product.find({ tenantId: req.tenantId, isActive: true }).select('name sku costPrice sellingPrice category');
    res.json({ success: true, data: products });
  } catch (err) {
    logger.error('Get pricing error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Update product selling price
 * @route   PUT /api/tenant/sales/pricing/:id
 * @access  Private (Tenant)
 */
const updatePrice = async (req, res) => {
  try {
    const { sellingPrice } = req.body;
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { sellingPrice },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    logger.error('Update price error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getOrders, createOrder, updateOrderStatus, getQuotations, createQuotation, getPricing, updatePrice };