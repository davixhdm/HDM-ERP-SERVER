const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, getHistory, runBackupNow, downloadBackup, deleteBackup } = require('../../controllers/admin/backupController');

// GET settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// GET history
router.get('/history', getHistory);

// POST run backup now
router.post('/run', runBackupNow);

// GET download backup by filename
router.get('/download/:filename', downloadBackup);

// DELETE a backup record
router.delete('/:id', deleteBackup);

module.exports = router;