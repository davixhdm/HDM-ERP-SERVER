const brevo = require('../config/brevo');
const config = require('../config/env');

const sendEmail = async ({ to, toName, subject, htmlContent, textContent }) => {
  try {
    const response = await brevo.sendTransacEmail({
      sender: { email: config.brevo.emailFrom, name: config.brevo.emailFromName },
      to: [{ email: to, name: toName || '' }],
      subject,
      htmlContent,
      textContent: textContent || ''
    });
    return response;
  } catch (error) {
    console.error('Email send failed:', error.body || error.message);
    throw error;
  }
};

module.exports = sendEmail;