const aiGateway = require('./aiGatewayService');
const LandingPageConfig = require('../models/public/LandingPageConfig');
const SystemSettings = require('../models/master/SystemSettings');
const Plan = require('../models/master/Plan');

const MODULE_LABELS = {
  finance: 'Finance', hr: 'HR', sales: 'Sales', inventory: 'Inventory',
  supplyChain: 'Supply Chain', orders: 'Orders', manufacturing: 'Manufacturing',
  contacts: 'Contacts', products: 'Products', reports: 'Reports',
  settings: 'Settings', dashboard: 'Dashboard', landingPage: 'Landing Page',
  aiSparkle: 'AI Assistant', aiFileUpload: 'AI File Upload', outwardApiKeys: 'Outward API Keys',
  communications: 'Communications', crm: 'CRM Pipeline', projects: 'Projects & Tasks', assets: 'Asset Management',
};

const ENTERPRISE_MODULES = [
  'Finance', 'HR', 'Sales', 'Inventory', 'Supply Chain', 'Orders',
  'Manufacturing', 'CRM Pipeline', 'Projects & Tasks', 'Asset Management',
  'Contacts', 'Products', 'Reports', 'Communications', 'AI Assistant',
  'AI File Upload', 'Outward API Keys', 'Dashboard', 'Settings'
];

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
  if (payments.paypal?.enabled) paymentMethods.push('PayPal');

  const currency = payments.currency || 'KSh';
  const rate = currency === 'KSh' ? 154 : currency === 'EUR' ? 0.92 : currency === 'GBP' ? 0.79 : 1;

  const detailedPlans = plans.map(p => {
    const monthly = Math.round((p.pricing.monthly || 0) * rate);
    const yearly = Math.round((p.pricing.yearly || 0) * rate);
    const permanent = Math.round((p.pricing.permanent || 0) * rate);

    const includedModules = Object.entries(p.modules || {}).filter(([_, v]) => v === true).map(([k]) => MODULE_LABELS[k] || k);
    const excludedModules = Object.entries(p.modules || {}).filter(([_, v]) => v !== true).map(([k]) => MODULE_LABELS[k] || k);

    const specialFeatures = [];
    if (p.limits?.aiWrite) specialFeatures.push('AI Write');
    if (p.limits?.whiteLabel) specialFeatures.push('White Label');
    if (p.limits?.multiCompany) specialFeatures.push('Multi-Company');
    if (p.limits?.dedicatedDatabase) specialFeatures.push('Dedicated Database');

    return {
      name: p.displayName, key: p.name,
      pricing: { monthly: monthly > 0 ? `${currency} ${monthly.toLocaleString()}/mo` : 'Free', yearly: yearly > 0 ? `${currency} ${yearly.toLocaleString()}/yr` : null, permanent: permanent > 0 ? `${currency} ${permanent.toLocaleString()} one-time` : null },
      trialDays: p.trialDays || 0,
      limits: { users: p.limits?.maxUsers || 0, storage: `${p.limits?.maxStorageGB || 0}GB`, reports: p.limits?.maxCustomReports || 0, support: p.limits?.supportLevel || 'community' },
      modulesIncluded: includedModules,
      modulesNotIncluded: excludedModules.length > 0 ? excludedModules : null,
      specialFeatures: specialFeatures.length > 0 ? specialFeatures : null,
      isFree: p.name === 'free_trial',
    };
  });

const plansTextSummary = detailedPlans.map(p => {
    let text = `${p.name}: Monthly ${p.pricing.monthly}`;
    if (p.pricing.yearly) text += ` | Yearly ${p.pricing.yearly}`;
    if (p.pricing.permanent) text += ` | One-time ${p.pricing.permanent}`;
    if (p.trialDays > 0) text += ` (${p.trialDays} day trial)`;
    text += ` | Includes: ${p.modulesIncluded.join(', ')}`;
    if (p.modulesNotIncluded && p.modulesNotIncluded.length <= 10) text += ` | NOT: ${p.modulesNotIncluded.join(', ')}`;
    text += ` | Limits: ${p.limits.users} users, ${p.limits.storage}, ${p.limits.reports} reports`;
    if (p.specialFeatures) text += ` | Extra: ${p.specialFeatures.join(', ')}`;
    return text;
  }).join('\n');

  const pricingSummary = detailedPlans.map(p => `${p.name}: ${p.pricing.monthly}${p.trialDays > 0 ? ` (${p.trialDays}d trial)` : ''}`).join(', ');

  const landingConfig = {
    company: { name: settings?.general?.systemName || 'HDM ERP', email: settings?.general?.contactEmail || 'support@hdmerp.com', phone: settings?.general?.contactPhone || '+254 768 784 909', address: settings?.general?.address || 'Nairobi, Kenya' },
    paymentMethods: paymentMethods.length ? paymentMethods : ['M-Pesa', 'Stripe', 'Bank Transfer'],
    currency,
    locations: config?.locations || ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'],
    contacts: { email: settings?.general?.contactEmail || 'support@hdmerp.com', phone: settings?.general?.contactPhone || '+254 768 784 909' },
    allFeatures: ENTERPRISE_MODULES,
    pricingSummary,
    plansTextSummary,
    plans: detailedPlans,
    faqs: config?.faqs?.questions?.map(q => ({ q: q.q, a: q.a })) || [],
    hero: { headline: config?.heroHeadline || settings?.landingPage?.heroHeadline || 'Smart Business Management', subtext: config?.heroSubtext || settings?.landingPage?.heroSubtext || 'Manage your entire business from one platform — powered by AI.' }
  };

  return aiGateway.landingQuery(question, landingConfig);
};

module.exports = { handleLandingChat };