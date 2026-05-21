const Tenant = require('../../models/master/Tenant');
const logger = require('../../utils/logger');

const tenantResolver = async (req, res, next) => {
  try {
    // If already resolved by auth middleware, skip
    if (req.tenantId) return next();

    // Try from subdomain
    const host = req.headers.host || '';
    const subdomain = host.split('.')[0];

    if (subdomain && subdomain !== 'localhost' && subdomain !== 'hdmerp' && subdomain !== 'hdmadmin') {
      const tenant = await Tenant.findOne({ subdomain, status: 'active' });
      if (tenant) {
        req.tenantId = tenant._id;
        req.tenant = tenant;
      }
    }

    next();
  } catch (err) {
    logger.warn(`Tenant resolver error: ${err.message}`);
    next();
  }
};

module.exports = tenantResolver;