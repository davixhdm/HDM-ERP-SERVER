const User = require('../../models/tenant/User');
const TrustedDevice = require('../../models/tenant/TrustedDevice');
const { signAccessToken, signRefreshToken } = require('../../utils/jwt');
const { generateDeviceId } = require('../../utils/deviceId');
const logger = require('../../utils/logger');

/**
 * @desc    Verify a new device with code
 * @route   POST /api/public/auth/verify-device
 * @access  Public
 */
const verifyDevice = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ success: false, message: 'Email and verification code required' });

    const user = await User.findOne({ email, isActive: true });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid or expired code' });

    if (!user.resetPasswordToken || user.resetPasswordToken !== code.toUpperCase()) {
      return res.status(401).json({ success: false, message: 'Invalid verification code' });
    }

    if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
      return res.status(401).json({ success: false, message: 'Verification code expired' });
    }

    // Trust this device
    const deviceId = generateDeviceId(req);
    await TrustedDevice.findOneAndUpdate(
      { userId: user._id, deviceId },
      { isTrusted: true, lastUsed: new Date() },
      { upsert: true }
    );

    // Clear verification token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.lastLogin = new Date();
    user.loginAttempts = 0;
    await user.save();

    const Tenant = require('../../models/master/Tenant');
    const tenant = await Tenant.findById(user.tenantId);

    const payload = { userId: user._id, tenantId: user.tenantId, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
        message: 'Device verified successfully'
      }
    });
  } catch (err) {
    logger.error('Device verification error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { verifyDevice };