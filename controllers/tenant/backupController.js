const BackupSettings = require('../../models/master/BackupSettings');
const BackupRecord = require('../../models/master/BackupRecord');
const logger = require('../../utils/logger');

/**
 * @desc    Get backup settings
 * @route   GET /api/tenant/backups/settings
 * @access  Private (Company Admin)
 */
const getBackupSettings = async (req, res) => {
  try {
    const settings = await BackupSettings.findOne();
    res.json({ success: true, data: settings || {} });
  } catch (err) {
    logger.error('Get backup settings error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Update backup settings
 * @route   PUT /api/tenant/backups/settings
 * @access  Private (Company Admin)
 */
const updateBackupSettings = async (req, res) => {
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
 * @route   GET /api/tenant/backups/history
 * @access  Private (Company Admin)
 */
const getBackupHistory = async (req, res) => {
  try {
    const records = await BackupRecord.find({ type: 'tenant', tenant: req.tenantId }).sort({ createdAt: -1 });
    res.json({ success: true, data: records });
  } catch (err) {
    logger.error('Get backup history error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getBackupSettings, updateBackupSettings, getBackupHistory };