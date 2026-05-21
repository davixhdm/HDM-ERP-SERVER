const Tenant = require('../../models/master/Tenant');
const Subscription = require('../../models/master/Subscription');
const LicenseKey = require('../../models/master/LicenseKey');
const PendingActivation = require('../../models/master/PendingActivation');
const logger = require('../../utils/logger');

/**
 * @desc    Get all tenants
 * @route   GET /api/admin/tenants
 * @access  Private (Super Admin)
 */
const getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: tenants });
  } catch (err) {
    logger.error('Get tenants error:', err.message || err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Get tenant detail with license key
 * @route   GET /api/admin/tenants/:id
 * @access  Private (Super Admin)
 */
const getTenantDetail = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).lean();
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

    const sub = await Subscription.findOne({ tenant: tenant._id, status: 'active' }).populate('licenseKey').lean();
    tenant.licenseKey = sub?.licenseKey?.key || null;

    res.json({ success: true, data: tenant });
  } catch (err) {
    logger.error('Get tenant detail error:', err.message || err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Suspend tenant
 * @route   PUT /api/admin/tenants/:id/suspend
 * @access  Private (Super Admin)
 */
const suspendTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(req.params.id, { status: 'suspended' }, { new: true });
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    res.json({ success: true, message: 'Tenant suspended', data: tenant });
  } catch (err) {
    logger.error('Suspend tenant error:', err.message || err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Delete tenant + all related records (cascade)
 * @route   DELETE /api/admin/tenants/:id
 * @access  Private (Super Admin)
 */
const deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await Tenant.findByIdAndDelete(id);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

    // Cascade delete all related records
    await Subscription.deleteMany({ tenant: id });
    await LicenseKey.deleteMany({ tenant: id });
    await PendingActivation.deleteMany({ tenant: id });

    res.json({ success: true, message: 'Tenant and all related records permanently deleted' });
  } catch (err) {
    logger.error('Delete tenant error:', err.message || err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getTenants, getTenantDetail, suspendTenant, deleteTenant };