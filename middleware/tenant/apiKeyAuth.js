const crypto = require('crypto');
const OutwardAPIKey = require('../../models/ai/OutwardAPIKey');
const Tenant = require('../../models/master/Tenant');
const logger = require('../../utils/logger');

const outwardApiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({ success: false, message: 'API key required. Use x-api-key header.' });
    }

    // Hash the key for lookup
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const keyRecord = await OutwardAPIKey.findOne({ key: apiKey, isActive: true });
    if (!keyRecord) {
      logger.warn(`Invalid outward API key attempt`);
      return res.status(401).json({ success: false, message: 'Invalid API key.' });
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      keyRecord.isActive = false;
      await keyRecord.save();
      return res.status(401).json({ success: false, message: 'API key has expired.' });
    }

    const tenant = await Tenant.findById(keyRecord.tenantId);
    if (!tenant || tenant.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Tenant not active.' });
    }

    // Update last used
    keyRecord.lastUsed = new Date();
    await keyRecord.save();

    req.tenantId = keyRecord.tenantId;
    req.tenant = tenant;
    req.apiKeyScopes = keyRecord.scopes;
    next();
  } catch (err) {
    logger.error(`API key auth error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = outwardApiKeyAuth;