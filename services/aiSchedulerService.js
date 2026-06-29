const cron = require('node-cron');
const Tenant = require('../models/master/Tenant');
const sendEmail = require('../utils/sendEmail');
const logger = require('../utils/logger');

let proactiveTask = null;
let trialExpiryTask = null;

const startProactiveAlerts = () => {
  if (proactiveTask) proactiveTask.stop();
  proactiveTask = cron.schedule('0 */6 * * *', async () => {
    logger.info('Running proactive AI alerts...');
    try {
      const aiGateway = require('./aiGatewayService');
      await aiGateway.runProactiveAlerts();
      logger.info('Proactive alerts completed');
    } catch (err) {
      logger.error('Proactive alerts failed:', err.message);
    }
  });

  if (trialExpiryTask) trialExpiryTask.stop();
  trialExpiryTask = cron.schedule('0 8 * * *', checkTrialExpiry);
  logger.info('Trial expiry checker started (daily at 8 AM)');
};

const stopProactiveAlerts = () => {
  if (proactiveTask) proactiveTask.stop();
  if (trialExpiryTask) trialExpiryTask.stop();
};

const checkTrialExpiry = async () => {
  try {
    const now = new Date();
    const alerts = [
      { days: 7, label: '7 Days' },
      { days: 3, label: '3 Days' },
      { days: 1, label: '1 Day' },
    ];

    // ===== SEND REMINDER EMAILS =====
    for (const { days, label } of alerts) {
      const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      // Free trial tenants
      const trialTenants = await Tenant.find({
        plan: 'free_trial',
        status: 'active',
        trialEndDate: { $gte: startOfDay, $lt: endOfDay },
      });

      for (const tenant of trialTenants) {
        try {
          await sendEmail({
            to: tenant.contactEmail,
            toName: tenant.companyName,
            subject: `HDM ERP — Trial Expires in ${label}`,
            htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px;border:1px solid #e5e7eb;border-radius:8px;">
              <div style="background:#10B981;padding:16px;text-align:center;border-radius:8px 8px 0 0;margin:-20px -20px 20px -20px;">
                <h2 style="color:#fff;margin:0;font-size:18px;">⏰ Trial Ending in ${label}</h2>
              </div>
              <p style="font-size:14px;">Hello <strong>${tenant.companyName}</strong>,</p>
              <p style="font-size:13px;color:#4b5563;">Your <strong>14-day free trial</strong> expires in <strong>${label}</strong> on <strong>${tenant.trialEndDate.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>.</p>
              <p style="font-size:13px;color:#4b5563;">Upgrade to a paid plan to keep access to all your data and features:</p>
              <div style="text-align:center;margin:20px 0;">
                <a href="https://hdmerp.pxxl.click/pricing" style="display:inline-block;background:#10B981;color:white;padding:12px 30px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;">Upgrade Now</a>
              </div>
              <p style="color:#9ca3af;font-size:11px;margin-top:20px;text-align:center;">Questions? Contact support@hdmerp.com or +254 768 784 909</p>
            </div>`,
          });
          logger.info(`Trial expiry email sent to ${tenant.companyName} (${label})`);
        } catch (e) {
          logger.warn(`Trial expiry email failed for ${tenant.companyName}:`, e.message);
        }
      }

      // Paid plan tenants
      const paidTenants = await Tenant.find({
        plan: { $in: ['standard', 'pro', 'enterprise'] },
        status: 'active',
        subscriptionExpiry: { $gte: startOfDay, $lt: endOfDay },
      });

      for (const tenant of paidTenants) {
        try {
          const planLabel = tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1);
          await sendEmail({
            to: tenant.contactEmail,
            toName: tenant.companyName,
            subject: `HDM ERP — ${planLabel} Subscription Expires in ${label}`,
            htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px;border:1px solid #e5e7eb;border-radius:8px;">
              <div style="background:#10B981;padding:16px;text-align:center;border-radius:8px 8px 0 0;margin:-20px -20px 20px -20px;">
                <h2 style="color:#fff;margin:0;font-size:18px;">📅 Subscription Expiring in ${label}</h2>
              </div>
              <p style="font-size:14px;">Hello <strong>${tenant.companyName}</strong>,</p>
              <p style="font-size:13px;color:#4b5563;">Your <strong>${planLabel}</strong> plan subscription expires in <strong>${label}</strong> on <strong>${tenant.subscriptionExpiry.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>.</p>
              <p style="font-size:13px;color:#4b5563;">Renew now to avoid service interruption:</p>
              <div style="text-align:center;margin:20px 0;">
                <a href="https://hdmerp.pxxl.click/login" style="display:inline-block;background:#10B981;color:white;padding:12px 30px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;">Renew Now</a>
              </div>
              <p style="color:#9ca3af;font-size:11px;margin-top:20px;text-align:center;">Questions? Contact support@hdmerp.com or +254 768 784 909</p>
            </div>`,
          });
          logger.info(`Subscription expiry email sent to ${tenant.companyName} (${label})`);
        } catch (e) {
          logger.warn(`Subscription expiry email failed for ${tenant.companyName}:`, e.message);
        }
      }
    }

    // ===== AUTO-EXPIRE OVERDUE TRIALS =====
    const expiredTrials = await Tenant.find({
      plan: 'free_trial',
      status: 'active',
      trialEndDate: { $lt: now },
    });

    for (const tenant of expiredTrials) {
      tenant.status = 'inactive';
      await tenant.save();

      try {
        await sendEmail({
          to: tenant.contactEmail,
          toName: tenant.companyName,
          subject: 'HDM ERP — Trial Has Expired',
          htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px;border:1px solid #e5e7eb;border-radius:8px;">
            <div style="background:#EF4444;padding:16px;text-align:center;border-radius:8px 8px 0 0;margin:-20px -20px 20px -20px;">
              <h2 style="color:#fff;margin:0;font-size:18px;">⚠️ Trial Expired</h2>
            </div>
            <p style="font-size:14px;">Hello <strong>${tenant.companyName}</strong>,</p>
            <p style="font-size:13px;color:#4b5563;">Your free trial ended on <strong>${tenant.trialEndDate.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>.</p>
            <p style="font-size:13px;color:#4b5563;">Your account is now inactive. Upgrade to a paid plan to regain access.</p>
            <div style="text-align:center;margin:20px 0;">
              <a href="https://hdmerp.pxxl.click/pricing" style="display:inline-block;background:#10B981;color:white;padding:12px 30px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;">View Plans & Upgrade</a>
            </div>
            <p style="color:#9ca3af;font-size:11px;margin-top:20px;text-align:center;">Questions? Contact support@hdmerp.com</p>
          </div>`,
        });
        logger.info(`Trial expired email sent to ${tenant.companyName}`);
      } catch (e) {
        logger.warn(`Trial expired email failed for ${tenant.companyName}:`, e.message);
      }
    }

    if (expiredTrials.length > 0) {
      logger.info(`Auto-expired ${expiredTrials.length} trial clients`);
    }

    // ===== AUTO-EXPIRE OVERDUE PAID SUBSCRIPTIONS =====
    const expiredPaid = await Tenant.find({
      plan: { $in: ['standard', 'pro', 'enterprise'] },
      status: 'active',
      subscriptionExpiry: { $lt: now },
    });

    for (const tenant of expiredPaid) {
      tenant.status = 'inactive';
      await tenant.save();

      try {
        const planLabel = tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1);
        await sendEmail({
          to: tenant.contactEmail,
          toName: tenant.companyName,
          subject: `HDM ERP — ${planLabel} Subscription Expired`,
          htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px;border:1px solid #e5e7eb;border-radius:8px;">
            <div style="background:#EF4444;padding:16px;text-align:center;border-radius:8px 8px 0 0;margin:-20px -20px 20px -20px;">
              <h2 style="color:#fff;margin:0;font-size:18px;">⚠️ Subscription Expired</h2>
            </div>
            <p style="font-size:14px;">Hello <strong>${tenant.companyName}</strong>,</p>
            <p style="font-size:13px;color:#4b5563;">Your <strong>${planLabel}</strong> subscription expired on <strong>${tenant.subscriptionExpiry.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>.</p>
            <p style="font-size:13px;color:#4b5563;">Your account is now inactive. Renew to regain access.</p>
            <div style="text-align:center;margin:20px 0;">
              <a href="https://hdmerp.pxxl.click/login" style="display:inline-block;background:#10B981;color:white;padding:12px 30px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;">Renew Now</a>
            </div>
            <p style="color:#9ca3af;font-size:11px;margin-top:20px;text-align:center;">Questions? Contact support@hdmerp.com</p>
          </div>`,
        });
        logger.info(`Subscription expired email sent to ${tenant.companyName}`);
      } catch (e) {
        logger.warn(`Subscription expired email failed for ${tenant.companyName}:`, e.message);
      }
    }

    if (expiredPaid.length > 0) {
      logger.info(`Auto-expired ${expiredPaid.length} paid clients`);
    }

  } catch (err) {
    logger.error('Trial expiry check error:', err.message);
  }
};

module.exports = { startProactiveAlerts, stopProactiveAlerts };