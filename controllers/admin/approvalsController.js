const PendingActivation = require('../../models/master/PendingActivation');
const Tenant = require('../../models/master/Tenant');
const Subscription = require('../../models/master/Subscription');
const User = require('../../models/tenant/User');
const licenseService = require('../../services/licenseService');
const brevoService = require('../../services/brevoService');
const { convert } = require('../../services/currencyService');
const logger = require('../../utils/logger');

const formatPrice = (num, currency) => currency === 'KSh' ? Math.round(num / 5) * 5 : Math.round(num * 100) / 100;

/**
 * @desc    Get pending payment approvals
 * @route   GET /api/admin/approvals
 * @access  Private (Super Admin)
 */
const getApprovals = async (req, res) => {
  try {
    const approvals = await PendingActivation.find().sort({ createdAt: -1 }).lean();
    const enriched = await Promise.all(approvals.map(async (a) => {
      const displayAmount = formatPrice(convert(a.amount, 'USD', a.displayCurrency || 'KSh'), a.displayCurrency || 'KSh');
      if (a.status === 'approved' && a.tenant) {
        const sub = await Subscription.findOne({ tenant: a.tenant, status: 'active' }).populate('licenseKey').lean();
        return { ...a, licenseKey: sub?.licenseKey?.key || null, displayAmount };
      }
      return { ...a, displayAmount };
    }));
    res.json({ success: true, data: enriched });
  } catch (err) {
    logger.error('Get approvals error: ' + (err.message || err));
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Approve a payment — creates tenant + user
 * @route   PUT /api/admin/approvals/:id/approve
 * @access  Private (Super Admin)
 */
const approvePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const approval = await PendingActivation.findById(id);
    if (!approval) return res.status(404).json({ success: false, message: 'Approval not found' });
    if (approval.status !== 'pending') return res.status(400).json({ success: false, message: 'Already processed' });

    let tenant = await Tenant.findOne({ contactEmail: approval.contactEmail, status: 'active' });
    if (!tenant) {
      tenant = await Tenant.create({
        companyName: approval.companyName,
        contactEmail: approval.contactEmail,
        contactPhone: approval.contactPhone || '',
        plan: approval.plan,
        status: 'active',
        currency: approval.displayCurrency || 'KSh',
        subscriptionExpiry: approval.billingCycle === 'monthly'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : approval.billingCycle === 'yearly'
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            : undefined
      });
    }

    let user = await User.findOne({ email: approval.contactEmail, tenantId: tenant._id });
    if (!user) {
      const userPassword = approval.password || 'changeme123';
      user = new User({
        tenantId: tenant._id,
        email: approval.contactEmail,
        password: userPassword,
        firstName: (approval.fullName || 'Admin').split(' ')[0],
        lastName: (approval.fullName || 'User').split(' ').slice(1).join(' ') || 'Account',
        role: 'company_admin'
      });
      await user.save();
    }

    const license = await licenseService.issueLicense(tenant._id, approval.plan);
    await Subscription.create({
      tenant: tenant._id,
      plan: approval.plan,
      billingCycle: approval.billingCycle,
      amount: approval.amount,
      currency: approval.currency,
      startDate: new Date(),
      status: 'active',
      licenseKey: license._id,
      paymentReference: approval.transactionId || ''
    });

    approval.status = 'approved';
    approval.tenant = tenant._id;
    approval.reviewedBy = req.admin._id;
    approval.reviewedAt = new Date();
    await approval.save();

    try { await brevoService.sendPaymentApproved(tenant.contactEmail, tenant.companyName, license.key, approval.plan); } catch (e) { logger.warn('Email failed'); }

    res.json({ success: true, message: 'Payment approved', licenseKey: license.key, tenantId: tenant._id });
  } catch (err) {
    logger.error('Approve error: ' + (err.message || err));
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Reject a payment
 * @route   PUT /api/admin/approvals/:id/reject
 * @access  Private (Super Admin)
 */
const rejectPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const approval = await PendingActivation.findById(id);
    if (!approval) return res.status(404).json({ success: false, message: 'Approval not found' });

    approval.status = 'rejected';
    approval.rejectionReason = reason || 'No reason provided';
    approval.reviewedBy = req.admin._id;
    approval.reviewedAt = new Date();
    await approval.save();

    try { await brevoService.sendPaymentRejected(approval.contactEmail, approval.companyName, reason); } catch (e) { logger.warn('Email failed'); }

    res.json({ success: true, message: 'Payment rejected' });
  } catch (err) {
    logger.error('Reject error: ' + (err.message || err));
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Delete an approval record
 * @route   DELETE /api/admin/approvals/:id
 * @access  Private (Super Admin)
 */
const deleteApproval = async (req, res) => {
  try {
    await PendingActivation.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Approval deleted' });
  } catch (err) {
    logger.error('Delete approval error: ' + (err.message || err));
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getApprovals, approvePayment, rejectPayment, deleteApproval };