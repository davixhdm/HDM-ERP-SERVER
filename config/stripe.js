const Stripe = require('stripe');
const config = require('./env');

const stripe = Stripe(config.stripe.secretKey);

module.exports = stripe;