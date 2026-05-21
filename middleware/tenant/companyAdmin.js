const logger = require('../../utils/logger');

const companyAdminAuth = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (req.user.role !== 'company_admin') {
      logger.warn(`Non-admin access attempt: ${req.user.email}`);
      return res.status(403).json({ success: false, message: 'Access denied. Company admin only.' });
    }

    next();
  } catch (err) {
    logger.error(`Company admin middleware error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = companyAdminAuth;