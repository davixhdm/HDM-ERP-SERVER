const User = require('../../models/tenant/User');
const Tenant = require('../../models/master/Tenant');
const TrustedDevice = require('../../models/tenant/TrustedDevice');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const { comparePassword } = require('../../utils/hashPassword');
const { generateDeviceId } = require('../../utils/deviceId');
const logger = require('../../utils/logger');

const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email, isActive: true });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const tenant = await Tenant.findById(user.tenantId);
    if (!tenant || tenant.status !== 'active') return res.status(401).json({ success: false, message: 'Company account inactive' });

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // Trust device only if rememberMe is checked
    if (rememberMe) {
      const deviceId = generateDeviceId(req);
      await TrustedDevice.findOneAndUpdate(
        { tenantId: tenant._id, deviceId },
        { tenantId: tenant._id, userId: user._id, deviceId, deviceName: (req.headers['user-agent'] || 'Unknown').substring(0, 100), ipAddress: req.ip || '', isTrusted: true, lastUsed: new Date() },
        { upsert: true, new: true }
      );
    }

    const payload = { userId: user._id, tenantId: tenant._id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.lastLogin = new Date();
    await user.save();

    res.json({ success: true, data: { accessToken, refreshToken, user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } } });
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

module.exports = { login, refreshToken };