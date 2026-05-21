const LicenseKey = require('../models/master/LicenseKey');
const { generateLicenseKey } = require('../utils/generateKey');
const Tenant = require('../models/master/Tenant');

const issueLicense = async (tenantId, plan) => {
  const key = generateLicenseKey('HDM');
  const license = await LicenseKey.create({
    key,
    tenant: tenantId,
    plan,
    issuedAt: new Date(),
    isActive: true
  });
  return license;
};

const validateLicense = async (licenseKey) => {
  const license = await LicenseKey.findOne({ key: licenseKey, isActive: true });
  if (!license) throw new Error('Invalid license key');
  if (license.expiresAt && license.expiresAt < new Date()) {
    license.isActive = false;
    await license.save();
    throw new Error('License key expired');
  }
  return license;
};

const revokeLicense = async (licenseId, adminId) => {
  const license = await LicenseKey.findByIdAndUpdate(licenseId, {
    isActive: false,
    revokedAt: new Date(),
    revokedBy: adminId
  }, { new: true });
  return license;
};

module.exports = { issueLicense, validateLicense, revokeLicense };