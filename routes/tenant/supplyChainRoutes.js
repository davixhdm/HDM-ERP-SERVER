const express = require('express');
const router = express.Router();
const {
  getPurchaseOrders,
  createPurchaseOrder,
  receiveGoods,
  getSuppliers,
  addSupplier,
  createRequisition,
  getRequisitions
} = require('../../controllers/tenant/supplyChainController');

router.get('/purchase-orders', getPurchaseOrders);
router.post('/purchase-orders', createPurchaseOrder);
router.post('/receiving', receiveGoods);
router.get('/suppliers', getSuppliers);
router.post('/suppliers', addSupplier);
router.post('/requisitions', createRequisition);
router.get('/requisitions', getRequisitions);

module.exports = router;