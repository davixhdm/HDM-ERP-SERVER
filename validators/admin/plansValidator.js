const Joi = require('joi');

const planSchema = Joi.object({
  name: Joi.string().valid('free_trial', 'standard', 'pro', 'enterprise').required(),
  displayName: Joi.string().required(),
  enabled: Joi.boolean(),
  trialDays: Joi.number().integer().min(0),
  sortOrder: Joi.number().integer(),
  pricing: Joi.object({
    monthly: Joi.number().min(0).default(0),
    yearly: Joi.number().min(0).default(0),
    permanent: Joi.number().min(0).default(0),
    stripePriceId: Joi.string().allow('')
  }),
  modules: Joi.object({
    finance: Joi.boolean(), hr: Joi.boolean(), sales: Joi.boolean(),
    inventory: Joi.boolean(), supplyChain: Joi.boolean(), orders: Joi.boolean(),
    manufacturing: Joi.boolean(), contacts: Joi.boolean(), products: Joi.boolean(),
    reports: Joi.boolean(), settings: Joi.boolean(), dashboard: Joi.boolean(),
    landingPage: Joi.boolean(), aiSparkle: Joi.boolean(), aiFileUpload: Joi.boolean(),
    outwardApiKeys: Joi.boolean()
  }),
  limits: Joi.object({
    maxUsers: Joi.number().integer().min(1),
    maxStorageGB: Joi.number().min(0),
    maxCustomReports: Joi.number().integer().min(0),
    aiWrite: Joi.boolean(),
    aiOutwardKeys: Joi.number().integer().min(0),
    whiteLabel: Joi.boolean(),
    multiCompany: Joi.boolean(),
    dedicatedDatabase: Joi.boolean(),
    supportLevel: Joi.string().valid('community', 'email_chat', 'dedicated')
  })
});

module.exports = { planSchema };