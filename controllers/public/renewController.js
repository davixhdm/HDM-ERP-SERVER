const Tenant = require('../../models/master/Tenant');
const Plan = require('../../models/master/Plan');
const Subscription = require('../../models/master/Subscription');
const sendEmail = require('../../utils/sendEmail');
const jwt = require('jsonwebtoken');
const logger = require('../../utils/logger');

/**
 * @desc    Get renew info from token (even if expired)
 * @route   GET /api/public/renew/info
 * @access  Public (with token)
 */
const getRenewInfo = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token required' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const tenant = await Tenant.findById(decoded.tenantId || decoded.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const currentPlan = await Plan.findOne({ name: tenant.plan });
    const allPlans = await Plan.find({ enabled: true, name: { $ne: 'free_trial' } }).sort({ sortOrder: 1 });

    const plans = allPlans.map(p => ({
      name: p.name,
      displayName: p.displayName,
      pricing: p.pricing,
      modules: Object.entries(p.modules || {}).filter(([_, v]) => v === true).map(([k]) => k),
      limits: p.limits,
    }));

    res.json({
      success: true,
      data: {
        companyName: tenant.companyName,
        email: tenant.contactEmail,
        currentPlan: tenant.plan,
        currentPlanName: currentPlan?.displayName || tenant.plan,
        trialEndDate: tenant.trialEndDate,
        subscriptionExpiry: tenant.subscriptionExpiry,
        currency: tenant.currency || 'KSh',
        availablePlans: plans,
      }
    });
  } catch (err) {
    logger.error('Get renew info error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Process renewal/upgrade
 * @route   POST /api/public/renew/pay
 * @access  Public (with token)
 */
const processRenew = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token required' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const { plan: planName, cycle } = req.body;
    if (!planName || !cycle) {
      return res.status(400).json({ success: false, message: 'Plan and billing cycle required' });
    }

    const tenant = await Tenant.findById(decoded.tenantId || decoded.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const plan = await Plan.findOne({ name: planName, enabled: true });
    if (!plan) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    const rate = tenant.currency === 'KSh' ? 154 : 1;
    let amount = 0;
    if (cycle === 'monthly') amount = Math.round((plan.pricing.monthly || 0) * rate);
    else if (cycle === 'yearly') amount = Math.round((plan.pricing.yearly || 0) * rate);
    else if (cycle === 'permanent') amount = Math.round((plan.pricing.permanent || 0) * rate);

    if (amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const startDate = new Date();
    let endDate = null;
    if (cycle === 'monthly') endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    else if (cycle === 'yearly') endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);

    // Create subscription as PENDING — admin must approve
    const subscription = await Subscription.create({
      tenant: tenant._id,
      plan: planName,
      billingCycle: cycle,
      amount,
      currency: tenant.currency || 'KSh',
      startDate,
      endDate,
      status: 'pending',
    });

    const reference = `RNW-${Date.now().toString(36).toUpperCase()}`;
    const displayAmount = `${tenant.currency} ${amount.toLocaleString()}`;

    // ===== Send confirmation to USER =====
    try {
      await sendEmail({
        to: tenant.contactEmail,
        toName: tenant.companyName,
        subject: `HDM ERP — Renewal Submitted for Approval (${plan.displayName})`,
        htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px;border:1px solid #e5e7eb;border-radius:8px;">
          <div style="background:#F59E0B;padding:16px;text-align:center;border-radius:8px 8px 0 0;margin:-20px -20px 20px -20px;">
            <h2 style="color:#fff;margin:0;font-size:18px;">📋 Renewal Submitted</h2>
          </div>
          <p style="font-size:14px;">Hello <strong>${tenant.companyName}</strong>,</p>
          <p style="font-size:13px;color:#4b5563;">Your renewal request has been submitted and is pending admin approval.</p>
          <table style="width:100%;border-collapse:collapse;margin:15px 0;font-size:13px;">
            <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Plan</td><td style="padding:8px;border:1px solid #e5e7eb;">${plan.displayName}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Billing</td><td style="padding:8px;border:1px solid #e5e7eb;">${cycle}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Amount</td><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;color:#F59E0B;">${displayAmount}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Reference</td><td style="padding:8px;border:1px solid #e5e7eb;">${reference}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Status</td><td style="padding:8px;border:1px solid #e5e7eb;color:#F59E0B;">Pending Approval</td></tr>
          </table>
          <p style="font-size:13px;color:#4b5563;">You will receive another email once your renewal is approved.</p>
          <p style="color:#9ca3af;font-size:11px;margin-top:20px;text-align:center;">Thank you for choosing HDM ERP</p>
        </div>`,
      });
      logger.info(`Renewal submission email sent to ${tenant.contactEmail}`);
    } catch (e) {
      logger.warn('Renewal submission email failed:', e.message);
    }

    // ===== Send approval request to ADMIN =====
    try {
      const approveUrl = `https://hdmerp.pxxl.click/admin/approvals/${subscription._id}`;
      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'davismcintyre5@gmail.com',
        toName: 'HDM ERP Admin',
        subject: `🔔 Renewal Approval Needed — ${tenant.companyName} (${plan.displayName})`,
        htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px;border:1px solid #e5e7eb;border-radius:8px;">
          <div style="background:#F59E0B;padding:16px;text-align:center;border-radius:8px 8px 0 0;margin:-20px -20px 20px -20px;">
            <h2 style="color:#fff;margin:0;font-size:18px;">Renewal Approval Required</h2>
          </div>
          <p style="font-size:14px;">A renewal request needs your approval:</p>
          <table style="width:100%;border-collapse:collapse;margin:15px 0;font-size:13px;">
            <tr><td style="padding:6px;font-weight:bold;">Company:</td><td>${tenant.companyName}</td></tr>
            <tr><td style="padding:6px;font-weight:bold;">Email:</td><td>${tenant.contactEmail}</td></tr>
            <tr><td style="padding:6px;font-weight:bold;">Current Plan:</td><td>${tenant.plan}</td></tr>
            <tr><td style="padding:6px;font-weight:bold;">New Plan:</td><td>${plan.displayName} (${cycle})</td></tr>
            <tr><td style="padding:6px;font-weight:bold;">Amount:</td><td style="font-weight:bold;">${displayAmount}</td></tr>
            <tr><td style="padding:6px;font-weight:bold;">Reference:</td><td>${reference}</td></tr>
          </table>
          <p style="text-align:center;margin:20px 0;">
            <a href="${approveUrl}" style="display:inline-block;background:#10B981;color:white;padding:12px 30px;text-decoration:none;border-radius:8px;font-weight:bold;">Approve Renewal</a>
          </p>
          <p style="text-align:center;">
            <a href="https://hdmerp.pxxl.click/admin" style="color:#F59E0B;font-size:13px;">Go to Admin Panel</a>
          </p>
        </div>`,
      });
      logger.info(`Admin renewal approval email sent for ${tenant.companyName}`);
    } catch (e) {
      logger.warn('Admin renewal approval email failed:', e.message);
    }

    res.json({
      success: true,
      data: {
        reference,
        amount,
        currency: tenant.currency,
        plan: planName,
        cycle,
        status: 'pending',
        message: 'Renewal submitted for admin approval. You will be notified once approved.',
      }
    });
  } catch (err) {
    logger.error('Process renew error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getRenewInfo, processRenew };