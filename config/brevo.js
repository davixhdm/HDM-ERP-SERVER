const brevo = require('@getbrevo/brevo');
const config = require('./env');

const client = new brevo.BrevoClient({ apiKey: config.brevo.apiKey });

module.exports = client;