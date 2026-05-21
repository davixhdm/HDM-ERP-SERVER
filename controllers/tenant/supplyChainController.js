const PurchaseOrder = require('../../models/tenant/PurchaseOrder');
const InventoryMovement = require('../../models/tenant/InventoryMovement');
const Product = require('../../models/tenant/Product');
const Contact = require('../../models/tenant/Contact');
const logger = require('../../utils/logger');

const getPurchaseOrders = async (req, res) => {
  try {
    const orders = await PurchaseOrder.find({ tenantId: req.tenantId }).populate('supplier').sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) { logger.error('Get POs error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};

const createPurchaseOrder = async (req, res) => {
  try {
    const { supplier, orderDate, expectedDelivery, items, notes } = req.body;
    const orderNumber = `PO-${Date.now()}`;
    const computedItems = items.map(i => ({ ...i, total: i.quantity * i.unitPrice }));
    const subtotal = computedItems.reduce((s, i) => s + i.total, 0);
    const order = await PurchaseOrder.create({
      tenantId: req.tenantId, orderNumber, supplier, orderDate, expectedDelivery,
      items: computedItems, subtotal, grandTotal: subtotal, status: 'draft', notes, createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: order });
  } catch (err) { logger.error('Create PO error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};

const receiveGoods = async (req, res) => {
  try {
    const { purchaseOrderId, warehouse, quantities } = req.body;
    const po = await PurchaseOrder.findOne({ _id: purchaseOrderId, tenantId: req.tenantId });
    if (!po) return res.status(404).json({ success: false, message: 'PO not found' });

    for (const [index, qty] of Object.entries(quantities)) {
      const item = po.items[parseInt(index)];
      if (item && qty > 0) {
        await InventoryMovement.create({
          tenantId: req.tenantId, product: item.product, warehouse: warehouse || null,
          type: 'receipt', quantity: parseInt(qty), unitCost: item.unitPrice,
          totalCost: parseInt(qty) * item.unitPrice, reference: po.orderNumber,
          sourceId: po._id, sourceType: 'purchase_order', createdBy: req.user._id
        });
        await Product.findOneAndUpdate({ _id: item.product, tenantId: req.tenantId }, { $inc: { stock: parseInt(qty) } });
      }
    }
    const allReceived = po.items.every((item, i) => (parseInt(quantities[i] || 0)) >= item.quantity);
    po.status = allReceived ? 'delivered' : 'processing';
    await po.save();
    res.json({ success: true, message: 'Goods received' });
  } catch (err) { logger.error('Receive error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};

const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Contact.find({ tenantId: req.tenantId, type: 'supplier' });
    res.json({ success: true, data: suppliers });
  } catch (err) { logger.error('Get suppliers error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};

const addSupplier = async (req, res) => {
  try {
    const contact = await Contact.create({ tenantId: req.tenantId, type: 'supplier', ...req.body });
    res.status(201).json({ success: true, data: contact });
  } catch (err) { logger.error('Add supplier error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};

const createRequisition = async (req, res) => {
  try {
    // Store in a simple way — could create a Requisition model, but for now just echo
    res.status(201).json({ success: true, message: 'Requisition submitted', data: req.body });
  } catch (err) { logger.error('Create requisition error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};

const getRequisitions = async (req, res) => {
  try {
    res.json({ success: true, data: [] });
  } catch (err) { logger.error('Get requisitions error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};

module.exports = { getPurchaseOrders, createPurchaseOrder, receiveGoods, getSuppliers, addSupplier, createRequisition, getRequisitions };