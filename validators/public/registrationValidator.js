const Joi = require('joi');

const registrationSchema = Joi.object({
  companyName: Joi.string().min(2).max(200).required(),
  legalName: Joi.string().allow(''),
  contactEmail: Joi.string().email().required(),
  contactPhone: Joi.string().allow(''),
  address: Joi.object({
    street: Joi.string().allow(''),
    city: Joi.string().allow(''),
    state: Joi.string().allow(''),
    postalCode: Joi.string().allow(''),
    country: Joi.string().default('Kenya')
  }),
  plan: Joi.string().valid('free_trial', 'standard', 'pro', 'enterprise').default('free_trial'),
  billingCycle: Joi.string().valid('monthly', 'yearly', 'permanent').default('monthly'),
  paymentMethod: Joi.string().required()
});

module.exports = { registrationSchema };