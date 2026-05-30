const aiGateway = require('./aiGatewayService');
const LandingPageConfig = require('../models/public/LandingPageConfig');
const SystemSettings = require('../models/master/SystemSettings');
const Plan = require('../models/master/Plan');

const handleLandingChat = async (question) => {
  const [config, settings, plans] = await Promise.all([
    LandingPageConfig.findOne(),
    SystemSettings.findOne(),
    Plan.find({ enabled: true }).sort({ sortOrder: 1 })
  ]);

  const payments = settings?.payments || {};
  let paymentMethods = [];
  if (payments.stripe?.enabled) paymentMethods.push('Stripe (Credit/Debit Cards)');
  if (payments.mpesa?.enabled) {
    if (payments.mpesa.stkPush) paymentMethods.push('M-Pesa STK Push');
    if (payments.mpesa.sendMoney?.enabled) paymentMethods.push(`M-Pesa Send Money (${payments.mpesa.sendMoney.phoneNumber || 'N/A'})`);
    if (payments.mpesa.paybill?.enabled) paymentMethods.push('M-Pesa Paybill');
    if (payments.mpesa.till?.enabled) paymentMethods.push('M-Pesa Buy Goods/Till');
  }

  const currency = payments.currency || 'KSh';
  const pricingPlans = plans.map(p => {
    const monthly = p.pricing.monthly || 0;
    const yearly = p.pricing.yearly || 0;
    return `${p.displayName}: ${currency} ${monthly.toLocaleString()}/mo, ${currency} ${yearly.toLocaleString()}/yr`;
  });

  const landingConfig = {
    paymentMethods: paymentMethods.length ? paymentMethods : ['M-Pesa', 'Stripe', 'Bank Transfer'],
    locations: config?.locations || ['Nairobi', 'Kenya'],
    contacts: {
      email: settings?.general?.contactEmail || 'support@hdmerp.com',
      phone: settings?.general?.contactPhone || '+254 768 784 909'
    },
    features: config?.features || config?.moduleTags || ['Finance', 'HR', 'Sales', 'Inventory', 'Manufacturing'],
    pricingSummary: pricingPlans.join(', ') || 'Free trial available',
    plans: pricingPlans
  };

  return aiGateway.landingQuery(question, landingConfig);
};

module.exports = { handleLandingChat };