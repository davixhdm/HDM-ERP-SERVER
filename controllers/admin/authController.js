const Admin = require('../../models/master/Admin');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const { comparePassword } = require('../../utils/hashPassword');
const logger = require('../../utils/logger');

/**
 * @desc    Super admin login
 * @route   POST /api/admin/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const admin = await Admin.findOne({ email, isActive: true });
    if (!admin) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await comparePassword(password, admin.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const payload = { id: admin._id, email: admin.email, role: 'super_admin' };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    admin.lastLogin = new Date();
    await admin.save();

    res.json({
      success: true,
      data: { accessToken, refreshToken, admin: { id: admin._id, email: admin.email, name: admin.name } }
    });
  } catch (err) {
    logger.error('Admin login error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Refresh admin access token
 * @route   POST /api/admin/auth/refresh
 * @access  Public
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Refresh token required' });

    const decoded = verifyRefreshToken(token);
    const admin = await Admin.findById(decoded.id);
    if (!admin || !admin.isActive) return res.status(401).json({ success: false, message: 'Invalid token' });

    const accessToken = signAccessToken({ id: admin._id, email: admin.email, role: 'super_admin' });
    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    logger.warn('Admin refresh token error:', err.message);
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = { login, refreshToken };