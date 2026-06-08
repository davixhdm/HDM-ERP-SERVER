const config = require('./env');
const axios = require('axios');

const sendEmail = async ({ to, toName, subject, htmlContent, textContent }) => {
  try {
    await axios.post(
      `${config.hdmEmail.apiUrl}/emails/send`,
      {
        from: config.hdmEmail.fromEmail,
        fromName: config.hdmEmail.fromName,
        to,
        subject,
        htmlBody: htmlContent,
        textBody: textContent || '',
      },
      {
        headers: {
          'Authorization': `Bearer ${config.hdmEmail.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    return { success: true };
  } catch (error) {
    console.error('Email send failed:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = sendEmail;