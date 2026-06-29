const crypto = require('crypto');
const User = require('../../models/tenant/User');
const Tenant = require('../../models/master/Tenant');
const TrustedDevice = require('../../models/tenant/TrustedDevice');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const { comparePassword } = require('../../utils/hashPassword');
const { generateDeviceId } = require('../../utils/deviceId');
const sendEmail = require('../../utils/sendEmail');
const logger = require('../../utils/logger');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email, isActive: true });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const tenant = await Tenant.findById(user.tenantId);
    if (!tenant) return res.status(401).json({ success: false, message: 'Company account not found' });

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // Allow login even if inactive/expired — middleware will block API calls with 403
    // This lets the user access /renew page

    const deviceId = generateDeviceId(req);
    const trustedDevice = await TrustedDevice.findOne({ tenantId: tenant._id, deviceId, isTrusted: true });
    if (!trustedDevice) return res.status(403).json({ success: false, message: 'Device not trusted. Please activate this device first.', requiresActivation: true });

    const payload = { userId: user._id, tenantId: tenant._id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.lastLogin = new Date();
    await user.save();
    trustedDevice.lastUsed = new Date();
    if (!trustedDevice.userId) trustedDevice.userId = user._id;
    await trustedDevice.save();

    res.json({ success: true, data: { accessToken, refreshToken, user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role }, accountStatus: tenant.status } });
  } catch (err) { logger.error('Login error: ' + (err.message || err)); res.status(500).json({ success: false, message: 'Internal server error' }); }
};
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Refresh token required' });
    const decoded = verifyRefreshToken(token);
    const user = await User.findOne({ _id: decoded.userId, tenantId: decoded.tenantId, isActive: true });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid token' });
    res.json({ success: true, data: { accessToken: signAccessToken({ userId: user._id, tenantId: decoded.tenantId, role: user.role }) } });
  } catch (err) { logger.warn('Refresh error: ' + (err.message || err)); res.status(401).json({ success: false, message: 'Invalid or expired token' }); }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email, isActive: true });
    if (!user) return res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetLink = `https://hdmerp.pxxl.click/reset-password?token=${resetToken}`;
    try {
      await sendEmail({
        to: user.email,
        toName: `${user.firstName} ${user.lastName}`,
        subject: 'HDM ERP — Password Reset',
        htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px;">
          <h2 style="color:#10B981;">Password Reset Request</h2>
          <p>Hello <strong>${user.firstName}</strong>,</p>
          <p>Click the button below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetLink}" style="display:inline-block;background:#10B981;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;margin:10px 0;">Reset Password</a>
          <p style="color:#6b7280;font-size:12px;">If you didn't request this, ignore this email.</p>
        </div>`,
      });
    } catch (e) { logger.warn('Reset email failed:', e.message); }

    res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
  } catch (err) { logger.error('Forgot password error:', err.message); res.status(500).json({ success: false, message: 'Internal server error' }); }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ success: false, message: 'Token and password required' });

    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() }, isActive: true });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) { logger.error('Reset password error:', err.message); res.status(500).json({ success: false, message: 'Internal server error' }); }
};

module.exports = { login, refreshToken, forgotPassword, resetPassword };