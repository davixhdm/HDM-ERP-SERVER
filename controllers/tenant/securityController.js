const TrustedDevice = require('../../models/tenant/TrustedDevice');
const User = require('../../models/tenant/User');
const logger = require('../../utils/logger');

/**
 * @desc    Get trusted devices
 * @route   GET /api/tenant/security/devices
 * @access  Private (Tenant)
 */
const getTrustedDevices = async (req, res) => {
  try {
    const devices = await TrustedDevice.find({ tenantId: req.tenantId, userId: req.user._id });
    res.json({ success: true, data: devices });
  } catch (err) {
    logger.error('Get trusted devices error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Remove a trusted device
 * @route   DELETE /api/tenant/security/devices/:id
 * @access  Private (Tenant)
 */
const removeTrustedDevice = async (req, res) => {
  try {
    await TrustedDevice.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId, userId: req.user._id });
    res.json({ success: true, message: 'Device removed' });
  } catch (err) {
    logger.error('Remove trusted device error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/tenant/security/password
 * @access  Private (Tenant)
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const isMatch = await require('../../utils/hashPassword').comparePassword(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed' });
  } catch (err) {
    logger.error('Change password error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getTrustedDevices, removeTrustedDevice, changePassword };