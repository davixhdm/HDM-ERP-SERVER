const BackupSettings = require('../../models/master/BackupSettings');
const BackupRecord = require('../../models/master/BackupRecord');
const backupService = require('../../services/backupService');
const logger = require('../../utils/logger');
const path = require('path');
const fs = require('fs');
const config = require('../../config/env');

/**
 * @desc    Get backup settings
 * @route   GET /api/admin/backups/settings
 * @access  Private (Super Admin)
 */
const getSettings = async (req, res) => {
  try {
    let settings = await BackupSettings.findOne();
    if (!settings) settings = await BackupSettings.create({});
    res.json({ success: true, data: settings });
  } catch (err) {
    logger.error('Get backup settings error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Update backup settings
 * @route   PUT /api/admin/backups/settings
 * @access  Private (Super Admin)
 */
const updateSettings = async (req, res) => {
  try {
    const settings = await BackupSettings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json({ success: true, data: settings });
  } catch (err) {
    logger.error('Update backup settings error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Get backup history
 * @route   GET /api/admin/backups/history
 * @access  Private (Super Admin)
 */
const getHistory = async (req, res) => {
  try {
    const records = await BackupRecord.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: records });
  } catch (err) {
    logger.error('Get backup history error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Run manual backup now
 * @route   POST /api/admin/backups/run
 * @access  Private (Super Admin)
 */
const runBackupNow = async (req, res) => {
  try {
    await backupService.runAllBackups();
    res.json({ success: true, message: 'Backup completed' });
  } catch (err) {
    logger.error('Run backup error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Download a backup file
 * @route   GET /api/admin/backups/download/:filename
 * @access  Private (Super Admin)
 */
const downloadBackup = async (req, res) => {
  try {
    const record = await BackupRecord.findOne({ filename: req.params.filename });
    if (!record) return res.status(404).json({ success: false, message: 'Backup not found' });

    let filePath;
    if (record.type === 'system') {
      filePath = path.join(config.backupDir, 'system', record.filename);
    } else if (record.tenant) {
      const Tenant = require('../../models/master/Tenant');
      const tenant = await Tenant.findById(record.tenant);
      filePath = path.join(config.backupDir, 'tenants', `${tenant.companyName}_${tenant._id}`, record.filename);
    }
    if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found' });
    res.download(filePath);
  } catch (err) {
    logger.error('Download backup error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Delete a backup record and file
 * @route   DELETE /api/admin/backups/:id
 * @access  Private (Super Admin)
 */
const deleteBackup = async (req, res) => {
  try {
    const record = await BackupRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Backup not found' });
    let filePath;
    if (record.type === 'system') {
      filePath = path.join(config.backupDir, 'system', record.filename);
    } else if (record.tenant) {
      const Tenant = require('../../models/master/Tenant');
      const tenant = await Tenant.findById(record.tenant);
      filePath = path.join(config.backupDir, 'tenants', `${tenant.companyName}_${tenant._id}`, record.filename);
    }
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await BackupRecord.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Backup deleted' });
  } catch (err) {
    logger.error('Delete backup error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getSettings, updateSettings, getHistory, runBackupNow, downloadBackup, deleteBackup };