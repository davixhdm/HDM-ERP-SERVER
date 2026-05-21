const SystemSettings = require('../models/master/SystemSettings');
const logger = require('../utils/logger');

const maintenanceCheck = async (req, res, next) => {
  try {
    if (req.originalUrl.startsWith('/api/admin')) return next();

    const settings = await SystemSettings.findOne();
    if (settings?.general?.maintenanceMode) {
      return res.status(503).json({
        success: false,
        message: settings.general.maintenanceMessage || 'Under maintenance. Please try again later.',
        maintenance: true
      });
    }

    next();
  } catch (err) {
    logger.warn('Maintenance check failed, allowing request:', err.message);
    next();
  }
};

module.exports = maintenanceCheck;