const brevo = require('../config/brevo');
const config = require('../config/env');

const sendSMS = async (to, content) => {
  try {
    const response = await brevo.sendTransacSms({
      sender: config.brevo.smsSender,
      recipient: to.replace('+', ''),
      content
    });
    return response;
  } catch (error) {
    console.error('SMS send failed:', error.body || error.message);
    throw error;
  }
};

module.exports = sendSMS;