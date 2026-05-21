const Joi = require('joi');

const updateCompanySchema = Joi.object({
  companyName: Joi.string().allow(''),
  legalName: Joi.string().allow(''),
  taxId: Joi.string().allow(''),
  registrationNumber: Joi.string().allow(''),
  currency: Joi.string().valid('KSh', 'USD', 'EUR', 'GBP').allow(''),
  contactEmail: Joi.string().email().allow(''),
  contactPhone: Joi.string().allow(''),
  website: Joi.string().uri().allow('', null),
  address: Joi.object({
    street: Joi.string().allow(''),
    city: Joi.string().allow(''),
    state: Joi.string().allow(''),
    postalCode: Joi.string().allow(''),
    country: Joi.string().allow('')
  }).allow(null),
  logo: Joi.string().uri().allow('', null)
});

module.exports = { updateCompanySchema };