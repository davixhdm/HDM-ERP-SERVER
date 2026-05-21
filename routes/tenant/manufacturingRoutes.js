const express = require('express');
const router = express.Router();
const {
  getBOMs, createBOM,
  getWorkOrders, createWorkOrder,
  logProduction, recordQC
} = require('../../controllers/tenant/manufacturingController');

// BOMs
router.get('/boms', getBOMs);
router.post('/boms', createBOM);

// Work Orders
router.get('/work-orders', getWorkOrders);
router.post('/work-orders', createWorkOrder);
router.put('/work-orders/:id/status', async (req, res) => {
  try {
    const WorkOrder = require('../../models/tenant/WorkOrder');
    const wo = await WorkOrder.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { status: req.body.status },
      { new: true }
    );
    if (!wo) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: wo });
  } catch (err) { res.status(500).json({ success: false, message: 'Error' }); }
});

// Shop Floor
router.post('/shop-floor', logProduction);

// QC
router.post('/quality-control', recordQC);

module.exports = router;