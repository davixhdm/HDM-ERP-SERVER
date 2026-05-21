const Product = require('../../models/tenant/Product');
const Warehouse = require('../../models/tenant/Warehouse');
const InventoryMovement = require('../../models/tenant/InventoryMovement');
const logger = require('../../utils/logger');

/**
 * @desc    Get stock overview
 * @route   GET /api/tenant/inventory/stock
 * @access  Private (Tenant)
 */
const getStockOverview = async (req, res) => {
  try {
    const products = await Product.find({ tenantId: req.tenantId, isActive: true });
    res.json({ success: true, data: products });
  } catch (err) {
    logger.error('Get stock overview error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Add product
 * @route   POST /api/tenant/inventory/stock
 * @access  Private (Tenant)
 */
const addProduct = async (req, res) => {
  try {
    const product = await Product.create({ tenantId: req.tenantId, ...req.body });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    logger.error('Add product error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/tenant/inventory/stock/:id
 * @access  Private (Tenant)
 */
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      req.body,
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    logger.error('Update product error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/tenant/inventory/stock/:id
 * @access  Private (Tenant)
 */
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    logger.error('Delete product error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Get stock movements
 * @route   GET /api/tenant/inventory/movements
 * @access  Private (Tenant)
 */
const getMovements = async (req, res) => {
  try {
    const movements = await InventoryMovement.find({ tenantId: req.tenantId }).populate('product').sort({ createdAt: -1 });
    res.json({ success: true, data: movements });
  } catch (err) {
    logger.error('Get movements error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Record stock movement
 * @route   POST /api/tenant/inventory/movements
 * @access  Private (Tenant)
 */
const recordMovement = async (req, res) => {
  try {
    const movement = await InventoryMovement.create({
      tenantId: req.tenantId,
      ...req.body,
      createdBy: req.user._id
    });
    // Update product stock
    if (movement.product) {
      const product = await Product.findById(movement.product);
      if (product) {
        const delta = ['receipt', 'transfer_in', 'return', 'production'].includes(movement.type) ? movement.quantity : -movement.quantity;
        product.stock = (product.stock || 0) + delta;
        await product.save();
      }
    }
    res.status(201).json({ success: true, data: movement });
  } catch (err) {
    logger.error('Record movement error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Get warehouses
 * @route   GET /api/tenant/inventory/warehouses
 * @access  Private (Tenant)
 */
const getWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ tenantId: req.tenantId });
    res.json({ success: true, data: warehouses });
  } catch (err) {
    logger.error('Get warehouses error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Add warehouse
 * @route   POST /api/tenant/inventory/warehouses
 * @access  Private (Tenant)
 */
const addWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.create({ tenantId: req.tenantId, ...req.body });
    res.status(201).json({ success: true, data: warehouse });
  } catch (err) {
    logger.error('Add warehouse error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Stock transfer
 * @route   POST /api/tenant/inventory/transfers
 * @access  Private (Tenant)
 */
const transferStock = async (req, res) => {
  try {
    const { product, fromWarehouse, toWarehouse, quantity } = req.body;
    const outMovement = await InventoryMovement.create({
      tenantId: req.tenantId,
      product,
      warehouse: fromWarehouse,
      type: 'transfer_out',
      quantity,
      createdBy: req.user._id
    });
    const inMovement = await InventoryMovement.create({
      tenantId: req.tenantId,
      product,
      warehouse: toWarehouse,
      type: 'transfer_in',
      quantity,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: { out: outMovement, in: inMovement } });
  } catch (err) {
    logger.error('Transfer stock error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getStockOverview, addProduct, updateProduct, deleteProduct,
  getMovements, recordMovement,
  getWarehouses, addWarehouse,
  transferStock
};