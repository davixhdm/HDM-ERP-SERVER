const express = require('express');
const router = express.Router();
const {
  getStockOverview, addProduct, updateProduct, deleteProduct,
  getMovements, recordMovement,
  getWarehouses, addWarehouse,
  transferStock
} = require('../../controllers/tenant/inventoryController');

// Stock
router.get('/stock', getStockOverview);
router.post('/stock', addProduct);
router.put('/stock/:id', updateProduct);
router.delete('/stock/:id', deleteProduct);

// Movements
router.get('/movements', getMovements);
router.post('/movements', recordMovement);

// Warehouses
router.get('/warehouses', getWarehouses);
router.post('/warehouses', addWarehouse);
router.put('/warehouses/:id', async (req, res) => {
  try {
    const Warehouse = require('../../models/tenant/Warehouse');
    const wh = await Warehouse.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      req.body,
      { new: true }
    );
    if (!wh) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: wh });
  } catch (err) { res.status(500).json({ success: false, message: 'Error' }); }
});
router.delete('/warehouses/:id', async (req, res) => {
  try {
    const Warehouse = require('../../models/tenant/Warehouse');
    await Warehouse.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: 'Error' }); }
});

// Transfers
router.post('/transfers', transferStock);

module.exports = router;