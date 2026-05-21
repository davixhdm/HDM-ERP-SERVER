const axios = require('axios');
const mpesaConfig = require('../config/mpesa');

const getToken = async () => {
  return mpesaConfig.getAuthToken();
};

const stkPush = async ({ phoneNumber, amount, accountReference, transactionDesc }) => {
  const token = await getToken();
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const password = Buffer.from(`${mpesaConfig.shortcode}${mpesaConfig.passkey}${timestamp}`).toString('base64');

  const response = await axios.post(`${mpesaConfig.baseUrl}/mpesa/stkpush/v1/processrequest`, {
    BusinessShortCode: mpesaConfig.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount),
    PartyA: phoneNumber,
    PartyB: mpesaConfig.shortcode,
    PhoneNumber: phoneNumber,
    CallBackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/webhooks/mpesa`,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

const queryStatus = async (checkoutRequestID) => {
  const token = await getToken();
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const password = Buffer.from(`${mpesaConfig.shortcode}${mpesaConfig.passkey}${timestamp}`).toString('base64');

  const response = await axios.post(`${mpesaConfig.baseUrl}/mpesa/stkpushquery/v1/query`, {
    BusinessShortCode: mpesaConfig.shortcode,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestID
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

module.exports = { stkPush, queryStatus };