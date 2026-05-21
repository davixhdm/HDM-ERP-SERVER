const stripe = require('../config/stripe');
const config = require('../config/env');

const createCheckoutSession = async ({ customerEmail, planName, billingCycle, amount, currency, tenantId }) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer_email: customerEmail,
    line_items: [{
      price_data: {
        currency: currency.toLowerCase(),
        product_data: { name: `HDM ERP ${planName} - ${billingCycle}` },
        recurring: billingCycle === 'yearly' ? { interval: 'year' } : { interval: 'month' },
        unit_amount: Math.round(amount * 100)
      },
      quantity: 1
    }],
    metadata: { tenantId: tenantId.toString(), planName, billingCycle },
    success_url: `${config.clientUrl}/activation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.clientUrl}/pricing`
  });
  return session;
};

const handleWebhook = (rawBody, signature) => {
  return stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
};

module.exports = { createCheckoutSession, handleWebhook };