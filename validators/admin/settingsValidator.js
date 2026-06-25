const Joi = require('joi');

const generalSettingsSchema = Joi.object({
  systemName: Joi.string(),
  tagline: Joi.string(),
  contactEmail: Joi.string().email(),
  contactPhone: Joi.string().allow(''),
  address: Joi.string().allow(''),
  timezone: Joi.string(),
  dateFormat: Joi.string(),
  defaultLanguage: Joi.string()
}).unknown(true);

const brandingSettingsSchema = Joi.object({
  logoNavbar: Joi.string().uri().allow(''),
  logoFavicon: Joi.string().uri().allow(''),
  primaryColor: Joi.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: Joi.string().regex(/^#[0-9A-Fa-f]{6}$/)
}).unknown(true);

const landingSettingsSchema = Joi.object({
  heroHeadline: Joi.string().allow(''),
  heroSubtext: Joi.string().allow(''),
  moduleTags: Joi.array().items(Joi.string()),
  launchButtonLabel: Joi.string(),
  registerButtonLabel: Joi.string(),
  aboutText: Joi.string().allow(''),
  footer: Joi.object({
    copyright: Joi.string().allow(''),
    privacyPolicyUrl: Joi.string().uri().allow(''),
    termsOfServiceUrl: Joi.string().uri().allow(''),
    licenseUrl: Joi.string().uri().allow(''),
    supportEmail: Joi.string().email().allow(''),
    supportPhone: Joi.string().allow('')
  })
}).unknown(true);

const uploadsSettingsSchema = Joi.object({
  maxFileSizeMB: Joi.number().min(1).max(100),
  allowedTypes: Joi.array().items(Joi.string())
}).unknown(true);

module.exports = { generalSettingsSchema, brandingSettingsSchema, landingSettingsSchema, uploadsSettingsSchema };