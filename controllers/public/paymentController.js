const PendingActivation = require('../../models/master/PendingActivation');
const Tenant = require('../../models/master/Tenant');
const Plan = require('../../models/master/Plan');
const SystemSettings = require('../../models/master/SystemSettings');
const Subscription = require('../../models/master/Subscription');
const User = require('../../models/tenant/User');
const licenseService = require('../../services/licenseService');
const stripeService = require('../../services/stripeService');
const mpesaService = require('../../services/mpesaService');
const sendEmail = require('../../utils/sendEmail');
const logger = require('../../utils/logger');

/**
 * @desc    Submit payment — creates activation, auto-approves free trials
 * @route   POST /api/public/payments
 * @access  Public
 */
const submitPayment = async (req, res) => {
  try {
    const { companyName, contactEmail, plan: planName, billingCycle, paymentMethod, phone, transactionId, password, fullName } = req.body;

    const plan = await Plan.findOne({ name: planName, enabled: true });
    if (!plan) return res.status(400).json({ success: false, message: 'Invalid plan' });

    const existingTenant = await Tenant.findOne({ contactEmail, status: 'active' });
    if (existingTenant) return res.status(400).json({ success: false, message: 'A company with this email is already active' });

    const settings = await SystemSettings.findOne().select('payments.currency');
    const currency = settings?.payments?.currency || 'KSh';
    const cycle = billingCycle || 'monthly';
    const amountUSD = cycle === 'yearly' ? plan.pricing.yearly : cycle === 'permanent' ? plan.pricing.permanent : plan.pricing.monthly;

    if (planName === 'free_trial') {
      const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const tenant = await Tenant.create({ companyName, contactEmail, contactPhone: phone || '', plan: planName, status: 'active', currency, subscriptionExpiry: trialEnd });
      const userPassword = password || 'changeme123';
      const user = new User({ tenantId: tenant._id, email: contactEmail, password: userPassword, firstName: (fullName || 'Admin').split(' ')[0], lastName: (fullName || 'User').split(' ').slice(1).join(' ') || 'Account', role: 'company_admin' });
      await user.save();
      const license = await licenseService.issueLicense(tenant._id, planName);
      await Subscription.create({ tenant: tenant._id, plan: planName, billingCycle: cycle, amount: 0, currency: 'USD', startDate: new Date(), status: 'active', licenseKey: license._id });
      await PendingActivation.create({ companyName, contactEmail, contactPhone: phone || '', password: userPassword, fullName: fullName || '', tenant: tenant._id, plan: planName, billingCycle: cycle, amount: 0, currency: 'USD', displayCurrency: currency, paymentMethod: 'free_trial', paymentConfirmed: true, status: 'approved', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });

      // Send welcome email
      try {
        await sendEmail({
          to: contactEmail,
          toName: fullName || companyName,
          subject: 'Welcome to HDM ERP — Free Trial Activated',
          htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px;">
            <h2 style="color:#10B981;">Welcome to HDM ERP!</h2>
            <p>Hello <strong>${fullName || companyName}</strong>,</p>
            <p>Your free trial has been activated successfully. Here are your details:</p>
            <div style="background:#f3f4f6;padding:15px;border-radius:8px;margin:15px 0;">
              <p><strong>License Key:</strong> ${license.key}</p>
              <p><strong>Plan:</strong> Free Trial (14 days)</p>
              <p><strong>Trial Ends:</strong> ${trialEnd.toLocaleDateString()}</p>
            </div>
            <p>Log in at <a href="https://hdmerp.pxxl.click/login" style="color:#10B981;">hdmerp.pxxl.click</a></p>
            <p style="color:#6b7280;font-size:12px;margin-top:20px;">If you have any questions, contact support@hdmerp.com</p>
          </div>`,
        });
      } catch (e) { logger.warn('Welcome email failed:', e.message); }

      return res.json({ success: true, message: 'Free trial activated!', licenseKey: license.key, tenantId: tenant._id });
    }

    const activation = await PendingActivation.create({ companyName, contactEmail, contactPhone: phone || '', password: password || '', fullName: fullName || '', plan: planName, billingCycle: cycle, amount: amountUSD, currency: 'USD', displayCurrency: currency, paymentMethod: paymentMethod || 'manual', paymentConfirmed: false, transactionId: transactionId || '', status: 'pending', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });

    // Send payment confirmation email
    try {
      await sendEmail({
        to: contactEmail,
        toName: fullName || companyName,
        subject: 'HDM ERP — Payment Submitted for Review',
        htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px;">
          <h2 style="color:#10B981;">Payment Submitted!</h2>
          <p>Hello <strong>${fullName || companyName}</strong>,</p>
          <p>Your payment for the <strong>${planName}</strong> plan has been submitted and is pending review.</p>
          <p>Amount: <strong>${currency} ${amountUSD.toLocaleString()}</strong></p>
          <p>You will receive your license key via email once approved.</p>
          <p style="color:#6b7280;font-size:12px;margin-top:20px;">If you have any questions, contact support@hdmerp.com</p>
        </div>`,
      });
    } catch (e) { logger.warn('Payment email failed:', e.message); }

    if (paymentMethod === 'stripe') {
      const session = await stripeService.createCheckoutSession({ customerEmail: contactEmail, planName, billingCycle: cycle, amount: amountUSD, currency: 'usd', tenantId: activation._id });
      activation.paymentMethod = 'stripe';
      await activation.save();
      return res.json({ success: true, data: { url: session.url }, activationId: activation._id });
    }
    if (paymentMethod === 'mpesa_stk') {
      if (!phone) return res.status(400).json({ success: false, message: 'Phone number required' });
      const result = await mpesaService.stkPush({ phoneNumber: phone, amount: amountUSD, accountReference: `HDM-${activation._id.toString().slice(-6)}`, transactionDesc: `HDM ERP ${planName} plan` });
      activation.paymentMethod = 'mpesa_stk';
      activation.transactionId = result.CheckoutRequestID || '';
      await activation.save();
      return res.json({ success: true, data: result, activationId: activation._id });
    }

    res.json({ success: true, message: 'Payment submitted for review', activationId: activation._id, amount: amountUSD, currency: 'USD', displayCurrency: currency });
  } catch (err) {
    logger.error('Payment error: ' + (err.message || err));
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { submitPayment };