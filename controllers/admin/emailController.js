const Tenant = require('../../models/master/Tenant');
const User = require('../../models/tenant/User');
const sendEmail = require('../../utils/sendEmail');
const logger = require('../../utils/logger');

/**
 * @desc    Send custom email to all tenants or specific tenant
 * @route   POST /api/admin/email/send
 * @access  Private (Super Admin)
 */
const sendCustomEmail = async (req, res) => {
  try {
    const { to, subject, message, tenantId, userId } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message are required' });
    }

    let recipients = [];

    if (to === 'all') {
      // Send to all active tenants
      const tenants = await Tenant.find({ status: 'active' });
      recipients = tenants.map(t => ({ email: t.contactEmail, name: t.companyName }));
    } else if (to === 'all-users' && tenantId) {
      // Send to all users of a specific tenant
      const users = await User.find({ tenantId, isActive: true });
      const tenant = await Tenant.findById(tenantId);
      recipients = users.map(u => ({ email: u.email, name: `${u.firstName} ${u.lastName}` }));
    } else if (to === 'tenant' && tenantId) {
      // Send to specific tenant
      const tenant = await Tenant.findById(tenantId);
      if (tenant) recipients = [{ email: tenant.contactEmail, name: tenant.companyName }];
    } else if (to === 'user' && userId) {
      // Send to specific user
      const user = await User.findById(userId);
      if (user) recipients = [{ email: user.email, name: `${user.firstName} ${user.lastName}` }];
    } else if (to === 'custom' && req.body.emails) {
      // Send to custom email list
      recipients = req.body.emails;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid recipient' });
    }

    if (!recipients.length) {
      return res.status(400).json({ success: false, message: 'No recipients found' });
    }

    let sent = 0;
    for (const recipient of recipients) {
      try {
        await sendEmail({
          to: recipient.email,
          toName: recipient.name || recipient.email,
          subject,
          htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px;">
            <h2 style="color:#10B981;">HDM ERP</h2>
            <div style="margin:20px 0;">${message}</div>
            <hr style="border-color:#e5e7eb;margin:20px 0;">
            <p style="color:#6b7280;font-size:12px;">This email was sent from HDM ERP Team</p>
          </div>`,
        });
        sent++;
        await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        logger.warn(`Email failed for ${recipient.email}:`, e.message);
      }
    }

    res.json({
      success: true,
      message: `Email sent to ${sent} of ${recipients.length} recipients`,
      total: recipients.length,
      sent,
    });
  } catch (err) {
    logger.error('Send custom email error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Get tenant list for email targeting
 * @route   GET /api/admin/email/recipients
 * @access  Private (Super Admin)
 */
const getRecipients = async (req, res) => {
  try {
    const [tenants, users] = await Promise.all([
      Tenant.find({ status: 'active' }).select('companyName contactEmail _id'),
      User.find({ isActive: true }).select('email firstName lastName tenantId _id').populate('tenantId', 'companyName'),
    ]);

    res.json({
      success: true,
      data: {
        tenants: tenants.map(t => ({ id: t._id, name: t.companyName, email: t.contactEmail })),
        users: users.map(u => ({ id: u._id, name: `${u.firstName} ${u.lastName}`, email: u.email, company: u.tenantId?.companyName })),
        totalTenants: tenants.length,
        totalUsers: users.length,
      }
    });
  } catch (err) {
    logger.error('Get recipients error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { sendCustomEmail, getRecipients };