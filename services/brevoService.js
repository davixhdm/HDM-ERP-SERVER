const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');
const fs = require('fs');
const path = require('path');

const loadTemplate = (templatePath, replacements) => {
  const filePath = path.resolve(__dirname, '..', 'templates', templatePath);
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [key, value] of Object.entries(replacements)) {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return content;
};

const sendPaymentSubmitted = async (email, name, reference) => {
  const html = loadTemplate('emails/paymentSubmitted.html', { name, reference });
  return sendEmail({ to: email, toName: name, subject: 'Payment Submitted', htmlContent: html });
};

const sendPaymentApproved = async (email, name, licenseKey, plan) => {
  const html = loadTemplate('emails/paymentApproved.html', { name, licenseKey, plan });
  const text = loadTemplate('sms/paymentApproved.txt', { name, licenseKey, plan });
  await sendEmail({ to: email, toName: name, subject: 'Payment Approved - License Key', htmlContent: html });
  await sendSMS(email, text);
};

const sendPaymentRejected = async (email, name, reason) => {
  const html = loadTemplate('emails/paymentRejected.html', { name, reason });
  return sendEmail({ to: email, toName: name, subject: 'Payment Rejected', htmlContent: html });
};

const sendLicenseKeyIssued = async (email, name, licenseKey, plan) => {
  const html = loadTemplate('emails/licenseKeyIssued.html', { name, licenseKey, plan });
  const text = loadTemplate('sms/licenseKeyIssued.txt', { name, licenseKey, plan });
  await sendEmail({ to: email, toName: name, subject: 'Your License Key', htmlContent: html });
  await sendSMS(email, text);
};

const sendStaffInvitation = async (email, name, companyName, inviteLink) => {
  const html = loadTemplate('emails/staffInvitation.html', { name, companyName, inviteLink });
  const text = loadTemplate('sms/staffInvitation.txt', { companyName, inviteLink });
  await sendEmail({ to: email, toName: name, subject: `Invitation to join ${companyName} on HDM ERP`, htmlContent: html });
  await sendSMS(email, text);
};

const sendPasswordReset = async (email, name, resetLink) => {
  const html = loadTemplate('emails/passwordReset.html', { name, resetLink });
  return sendEmail({ to: email, toName: name, subject: 'Password Reset Request', htmlContent: html });
};

const sendPlanExpiryReminder = async (email, name, daysLeft) => {
  const html = loadTemplate('emails/planExpiryReminder.html', { name, daysLeft });
  return sendEmail({ to: email, toName: name, subject: 'Plan Expiry Reminder', htmlContent: html });
};

module.exports = {
  sendPaymentSubmitted,
  sendPaymentApproved,
  sendPaymentRejected,
  sendLicenseKeyIssued,
  sendStaffInvitation,
  sendPasswordReset,
  sendPlanExpiryReminder
};