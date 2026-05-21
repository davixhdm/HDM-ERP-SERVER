const BillOfMaterial = require('../../models/tenant/BillOfMaterial');
const WorkOrder = require('../../models/tenant/WorkOrder');
const InventoryMovement = require('../../models/tenant/InventoryMovement');
const Product = require('../../models/tenant/Product');
const logger = require('../../utils/logger');

/**
 * @desc    Get bill of materials
 * @route   GET /api/tenant/manufacturing/boms
 * @access  Private (Tenant)
 */
const getBOMs = async (req, res) => {
  try {
    const boms = await BillOfMaterial.find({ tenantId: req.tenantId }).populate('product');
    res.json({ success: true, data: boms });
  } catch (err) {
    logger.error('Get BOMs error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Create bill of materials
 * @route   POST /api/tenant/manufacturing/boms
 * @access  Private (Tenant)
 */
const createBOM = async (req, res) => {
  try {
    const bom = await BillOfMaterial.create({ tenantId: req.tenantId, ...req.body });
    res.status(201).json({ success: true, data: bom });
  } catch (err) {
    logger.error('Create BOM error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Get work orders
 * @route   GET /api/tenant/manufacturing/work-orders
 * @access  Private (Tenant)
 */
const getWorkOrders = async (req, res) => {
  try {
    const orders = await WorkOrder.find({ tenantId: req.tenantId }).populate('product');
    res.json({ success: true, data: orders });
  } catch (err) {
    logger.error('Get work orders error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Create work order
 * @route   POST /api/tenant/manufacturing/work-orders
 * @access  Private (Tenant)
 */
const createWorkOrder = async (req, res) => {
  try {
    const order = await WorkOrder.create({
      tenantId: req.tenantId,
      ...req.body,
      orderNumber: `WO-${Date.now()}`
    });
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    logger.error('Create work order error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Log shop floor production
 * @route   POST /api/tenant/manufacturing/shop-floor
 * @access  Private (Tenant)
 */
const logProduction = async (req, res) => {
  try {
    const { workOrderId, outputQty, scrapQty } = req.body;
    const wo = await WorkOrder.findOne({ _id: workOrderId, tenantId: req.tenantId });
    if (!wo) return res.status(404).json({ success: false, message: 'Work order not found' });

    if (outputQty) {
      await InventoryMovement.create({
        tenantId: req.tenantId,
        product: wo.product,
        type: 'production',
        quantity: outputQty,
        createdBy: req.user._id
      });
      wo.outputQuantity = (wo.outputQuantity || 0) + outputQty;
    }
    if (scrapQty) {
      await InventoryMovement.create({
        tenantId: req.tenantId,
        product: wo.product,
        type: 'consumption',
        quantity: scrapQty,
        createdBy: req.user._id
      });
      wo.scrapQuantity = (wo.scrapQuantity || 0) + scrapQty;
    }
    wo.status = 'completed';
    await wo.save();
    res.json({ success: true, data: wo });
  } catch (err) {
    logger.error('Log production error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Record quality control
 * @route   POST /api/tenant/manufacturing/quality-control
 * @access  Private (Tenant)
 */
const recordQC = async (req, res) => {
  try {
    const { workOrderId, pass, notes } = req.body;
    const wo = await WorkOrder.findOne({ _id: workOrderId, tenantId: req.tenantId });
    if (!wo) return res.status(404).json({ success: false, message: 'Work order not found' });

    wo.qualityStatus = pass ? 'passed' : 'failed';
    if (!pass) wo.status = 'processing'; // back to processing for rework
    wo.notes = notes || wo.notes;
    await wo.save();
    res.json({ success: true, data: wo });
  } catch (err) {
    logger.error('Record QC error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getBOMs, createBOM, getWorkOrders, createWorkOrder, logProduction, recordQC };