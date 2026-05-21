const LicenseKey = require('../../models/master/LicenseKey');
const Tenant = require('../../models/master/Tenant');
const TrustedDevice = require('../../models/tenant/TrustedDevice');
const { generateDeviceId } = require('../../utils/deviceId');
const logger = require('../../utils/logger');

const activateAccount = async (req, res) => {
  try {
    const { licenseKey } = req.body;
    if (!licenseKey) return res.status(400).json({ success: false, message: 'License key is required' });

    const license = await LicenseKey.findOne({ key: licenseKey, isActive: true });
    if (!license) return res.status(400).json({ success: false, message: 'Invalid license key' });
    if (license.expiresAt && license.expiresAt < new Date()) { license.isActive = false; await license.save(); return res.status(400).json({ success: false, message: 'License key has expired' }); }

    const tenant = await Tenant.findById(license.tenant);
    if (!tenant || tenant.status !== 'active') return res.status(400).json({ success: false, message: 'Company account is not active' });

    const deviceId = generateDeviceId(req);
    await TrustedDevice.findOneAndUpdate(
      { tenantId: tenant._id, deviceId },
      { tenantId: tenant._id, deviceId, deviceName: (req.headers['user-agent'] || 'Unknown').substring(0, 100), ipAddress: req.ip || '', isTrusted: true, lastUsed: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Device activated successfully', data: { tenantId: tenant._id, companyName: tenant.companyName } });
  } catch (err) { logger.error('Activation error: ' + (err.message || err)); res.status(500).json({ success: false, message: 'Internal server error' }); }
};

module.exports = { activateAccount };