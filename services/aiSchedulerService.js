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

  // Trial expiry reminders — daily at 8 AM
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

    for (const { days, label } of alerts) {
      const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const tenants = await Tenant.find({
        plan: 'free_trial',
        status: 'active',
        subscriptionExpiry: { $gte: startOfDay, $lt: endOfDay },
      });

      for (const tenant of tenants) {
        try {
          await sendEmail({
            to: tenant.contactEmail,
            toName: tenant.companyName,
            subject: `HDM ERP — Trial Expires in ${label}`,
            htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px;">
              <h2 style="color:#10B981;">Your Trial is Ending Soon</h2>
              <p>Hello <strong>${tenant.companyName}</strong>,</p>
              <p>Your free trial expires in <strong>${label}</strong> on ${tenant.subscriptionExpiry.toLocaleDateString()}.</p>
              <p>Upgrade now to keep access to all features and your data.</p>
              <a href="https://hdmerp.pxxl.click/pricing" style="display:inline-block;background:#10B981;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;margin:10px 0;">Upgrade Plan</a>
              <p style="color:#6b7280;font-size:12px;margin-top:20px;">If you have questions, contact support@hdmerp.com</p>
            </div>`,
          });
          logger.info(`Trial expiry email sent to ${tenant.companyName} (${label})`);
        } catch (e) {
          logger.warn(`Trial expiry email failed for ${tenant.companyName}:`, e.message);
        }
      }
    }
  } catch (err) {
    logger.error('Trial expiry check error:', err.message);
  }
};

module.exports = { startProactiveAlerts, stopProactiveAlerts };