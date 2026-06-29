const { verifyAccessToken } = require('../../utils/jwt');
const User = require('../../models/tenant/User');
const Tenant = require('../../models/master/Tenant');
const logger = require('../../utils/logger');

const tenantAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded.tenantId || !decoded.userId) {
      return res.status(401).json({ success: false, message: 'Invalid token payload.' });
    }

    const tenant = await Tenant.findById(decoded.tenantId);
    if (!tenant) {
      return res.status(401).json({ success: false, message: 'Company account not found.' });
    }

    const user = await User.findOne({ _id: decoded.userId, tenantId: decoded.tenantId }).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User account not found or inactive.' });
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(423).json({ success: false, message: 'Account temporarily locked. Try again later.' });
    }

    req.user = user;
    req.tenant = tenant;
    req.tenantId = tenant._id;
    next();
  } catch (err) {
    logger.warn(`Tenant auth failed: ${err.message}`);
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = tenantAuth;