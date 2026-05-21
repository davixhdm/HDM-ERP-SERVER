const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../../controllers/tenant/productsController');

// GET /api/tenant/products
router.get('/', getProducts);

// POST /api/tenant/products
router.post('/', createProduct);

// PUT /api/tenant/products/:id
router.put('/:id', updateProduct);

// DELETE /api/tenant/products/:id
router.delete('/:id', deleteProduct);

module.exports = router;