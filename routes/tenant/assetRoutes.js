const express = require('express');
const router = express.Router();
const {
  getAssets, getAsset, createAsset, updateAsset, deleteAsset, depreciateAsset,
  getMaintenances, createMaintenance, updateMaintenance, deleteMaintenance,
  getAssetStats
} = require('../../controllers/tenant/assetController');

// Assets
router.get('/', getAssets);
router.get('/stats', getAssetStats);
router.get('/:id', getAsset);
router.post('/', createAsset);
router.put('/:id', updateAsset);
router.delete('/:id', deleteAsset);
router.post('/:id/depreciate', depreciateAsset);

// Maintenance
router.get('/:assetId/maintenance', getMaintenances);
router.post('/:assetId/maintenance', createMaintenance);
router.put('/maintenance/:maintId', updateMaintenance);
router.delete('/maintenance/:maintId', deleteMaintenance);

module.exports = router;