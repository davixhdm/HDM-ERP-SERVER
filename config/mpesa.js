const axios = require('axios');
const config = require('./env');

const getBaseUrl = () => {
  return config.mpesa.environment === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
};

const getAuthToken = async () => {
  const auth = Buffer.from(`${config.mpesa.consumerKey}:${config.mpesa.consumerSecret}`).toString('base64');
  const response = await axios.get(`${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` }
  });
  return response.data.access_token;
};

module.exports = {
  getAuthToken,
  baseUrl: getBaseUrl(),
  shortcode: config.mpesa.shortcode,
  passkey: config.mpesa.passkey,
  consumerKey: config.mpesa.consumerKey,
  consumerSecret: config.mpesa.consumerSecret
};