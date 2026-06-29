const PendingActivation = require('../../models/master/PendingActivation');
const Tenant = require('../../models/master/Tenant');
const Subscription = require('../../models/master/Subscription');
const User = require('../../models/tenant/User');
const licenseService = require('../../services/licenseService');
const brevoService = require('../../services/brevoService');
const sendEmail = require('../../utils/sendEmail');
const { convert } = require('../../services/currencyService');
const logger = require('../../utils/logger');

const formatPrice = (num, currency) => currency === 'KSh' ? Math.round(num / 5) * 5 : Math.round(num * 100) / 100;

/**
 * @desc    Get pending payment approvals (activations + renewals)
 * @route   GET /api/admin/approvals
 * @access  Private (Super Admin)
 */
const getApprovals = async (req, res) => {
  try {
    const [activations, renewals] = await Promise.all([
      PendingActivation.find().sort({ createdAt: -1 }).lean(),
      Subscription.find({ status: 'pending' }).populate('tenant', 'companyName contactEmail plan').sort({ createdAt: -1 }).lean()
    ]);

    const enrichedActivations = await Promise.all(activations.map(async (a) => {
      const displayAmount = formatPrice(convert(a.amount, 'USD', a.displayCurrency || 'KSh'), a.displayCurrency || 'KSh');
      if (a.status === 'approved' && a.tenant) {
        const sub = await Subscription.findOne({ tenant: a.tenant, status: 'active' }).populate('licenseKey').lean();
        return { ...a, type: 'activation', licenseKey: sub?.licenseKey?.key || null, displayAmount };
      }
      return { ...a, type: 'activation', displayAmount };
    }));

    const enrichedRenewals = renewals.map(r => ({
      _id: r._id,
      type: 'renewal',
      companyName: r.tenant?.companyName || 'N/A',
      contactEmail: r.tenant?.contactEmail || 'N/A',
      plan: r.plan,
      billingCycle: r.billingCycle,
      amount: r.amount,
      currency: r.currency,
      displayAmount: formatPrice(r.amount, r.currency || 'KSh'),
      status: r.status,
      createdAt: r.createdAt,
      tenant: r.tenant?._id,
    }));

    const all = [...enrichedActivations, ...enrichedRenewals].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: all });
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
    const { type } = req.body;

    // ===== RENEWAL APPROVAL =====
    if (type === 'renewal') {
      const subscription = await Subscription.findById(id).populate('tenant');
      if (!subscription) return res.status(404).json({ success: false, message: 'Renewal not found' });
      if (subscription.status !== 'pending') return res.status(400).json({ success: false, message: 'Already processed' });

      const tenant = subscription.tenant;
      const plan = subscription.plan;
      const cycle = subscription.billingCycle;

      // Activate subscription
      subscription.status = 'active';
      await subscription.save();

      // Update tenant
      tenant.plan = plan;
      tenant.subscriptionExpiry = subscription.endDate;
      tenant.trialEndDate = null;
      tenant.status = 'active';
      await tenant.save();

      const displayAmount = `${subscription.currency || 'KSh'} ${subscription.amount?.toLocaleString()}`;

      // Send approved email to user
      try {
        await sendEmail({
          to: tenant.contactEmail,
          toName: tenant.companyName,
          subject: `HDM ERP — Renewal Approved! (${plan})`,
          htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px;border:1px solid #e5e7eb;border-radius:8px;">
            <div style="background:#10B981;padding:16px;text-align:center;border-radius:8px 8px 0 0;margin:-20px -20px 20px -20px;">
              <h2 style="color:#fff;margin:0;font-size:18px;">✅ Renewal Approved — Subscription Active</h2>
            </div>
            <p style="font-size:14px;">Hello <strong>${tenant.companyName}</strong>,</p>
            <p style="font-size:13px;color:#4b5563;">Your renewal has been approved! Your subscription is now active.</p>
            <table style="width:100%;border-collapse:collapse;margin:15px 0;font-size:13px;">
              <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Plan</td><td style="padding:8px;border:1px solid #e5e7eb;">${plan} (${cycle})</td></tr>
              <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Amount</td><td style="padding:8px;border:1px solid #e5e7eb;color:#10B981;font-weight:bold;">${displayAmount}</td></tr>
              ${subscription.endDate ? `<tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Valid Until</td><td style="padding:8px;border:1px solid #e5e7eb;">${subscription.endDate.toLocaleDateString()}</td></tr>` : ''}
            </table>
            <div style="text-align:center;margin:20px 0;">
              <a href="https://hdmerp.pxxl.click/login" style="display:inline-block;background:#10B981;color:white;padding:12px 30px;text-decoration:none;border-radius:8px;font-weight:bold;">Login to Dashboard</a>
            </div>
            <p style="color:#9ca3af;font-size:11px;margin-top:20px;text-align:center;">Thank you for choosing HDM ERP</p>
          </div>`,
        });
      } catch (e) { logger.warn('Renewal approved email failed:', e.message); }

      return res.json({ success: true, message: 'Renewal approved', tenantId: tenant._id });
    }

    // ===== ACTIVATION APPROVAL (existing) =====
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
    const { reason, type } = req.body;

    // ===== RENEWAL REJECTION =====
    if (type === 'renewal') {
      const subscription = await Subscription.findById(id).populate('tenant');
      if (!subscription) return res.status(404).json({ success: false, message: 'Renewal not found' });

      subscription.status = 'cancelled';
      await subscription.save();

      try {
        await sendEmail({
          to: subscription.tenant?.contactEmail,
          toName: subscription.tenant?.companyName,
          subject: 'HDM ERP — Renewal Not Approved',
          htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px;">
            <h2 style="color:#EF4444;">Renewal Not Approved</h2>
            <p>Your renewal request for <strong>${subscription.plan}</strong> was not approved.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p>Please contact support@hdmerp.com for assistance.</p>
          </div>`,
        });
      } catch (e) { logger.warn('Renewal rejection email failed:', e.message); }

      return res.json({ success: true, message: 'Renewal rejected' });
    }

    // ===== ACTIVATION REJECTION (existing) =====
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
    const { type } = req.query;
    if (type === 'renewal') {
      await Subscription.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: 'Renewal deleted' });
    }
    await PendingActivation.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Approval deleted' });
  } catch (err) {
    logger.error('Delete approval error: ' + (err.message || err));
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getApprovals, approvePayment, rejectPayment, deleteApproval };