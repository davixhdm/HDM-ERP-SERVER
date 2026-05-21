const express = require('express');
const router = express.Router();
const { getBackupSettings, updateBackupSettings, getBackupHistory } = require('../../controllers/tenant/backupController');
const companyAdminAuth = require('../../middleware/tenant/companyAdmin');
const path = require('path');
const fs = require('fs');

router.get('/settings', getBackupSettings);
router.put('/settings', companyAdminAuth, updateBackupSettings);
router.get('/history', companyAdminAuth, getBackupHistory);

router.post('/run', companyAdminAuth, async (req, res) => {
  try {
    const backupService = require('../../services/backupService');
    await backupService.runTenantBackups();
    res.json({ success: true, message: 'Backup started' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Backup failed' });
  }
});

router.get('/download/:filename', companyAdminAuth, async (req, res) => {
  try {
    const BackupRecord = require('../../models/master/BackupRecord');
    const Tenant = require('../../models/master/Tenant');
    const record = await BackupRecord.findOne({ filename: req.params.filename, tenant: req.tenantId });
    if (!record) return res.status(404).json({ success: false, message: 'Not found' });
    const tenant = await Tenant.findById(req.tenantId);
    const filePath = path.join(require('../../config/env').backupDir, 'tenants', `${tenant.companyName}_${tenant._id}`, record.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found' });
    res.download(filePath);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error' });
  }
});

router.delete('/:id', companyAdminAuth, async (req, res) => {
  try {
    const BackupRecord = require('../../models/master/BackupRecord');
    await BackupRecord.findOneAndDelete({ _id: req.params.id, tenant: req.tenantId });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error' });
  }
});

module.exports = router;