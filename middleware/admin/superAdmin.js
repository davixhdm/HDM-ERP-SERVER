const { verifyAccessToken } = require('../../utils/jwt');
const Admin = require('../../models/master/Admin');
const logger = require('../../utils/logger');

const superAdminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (decoded.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Super admin only.' });
    }

    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: 'Admin account not found or inactive.' });
    }

    req.admin = admin;
    next();
  } catch (err) {
    logger.warn(`Super admin auth failed: ${err.message}`);
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = superAdminAuth;