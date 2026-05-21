const Product = require('../../models/tenant/Product');
const logger = require('../../utils/logger');

/**
 * @desc    Get all products
 * @route   GET /api/tenant/products
 * @access  Private (Tenant)
 */
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ tenantId: req.tenantId });
    res.json({ success: true, data: products });
  } catch (err) {
    logger.error('Get products error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Create product
 * @route   POST /api/tenant/products
 * @access  Private (Tenant)
 */
const createProduct = async (req, res) => {
  try {
    const data = { ...req.body, tenantId: req.tenantId };
    if (data.quantity !== undefined) {
      data.stock = data.quantity;
      delete data.quantity;
    }
    const product = await Product.create(data);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    console.error('CREATE PRODUCT ERROR:', err);
    logger.error('Create product error: ' + (err.message || JSON.stringify(err)));
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/tenant/products/:id
 * @access  Private (Tenant)
 */
const updateProduct = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.quantity !== undefined) {
      data.stock = data.quantity;
      delete data.quantity;
    }
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      data,
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
 * @route   DELETE /api/tenant/products/:id
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

module.exports = { getProducts, createProduct, updateProduct, deleteProduct };