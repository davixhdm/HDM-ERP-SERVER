const Joi = require('joi');

const updateAISettingsSchema = Joi.object({
  keySource: Joi.string().valid('hdm', 'own').required(),
  provider: Joi.string().valid('openai', 'anthropic', 'deepseek', 'gemini', 'mistral', 'cohere', '').allow('', null),
  model: Joi.string().allow('', null),
  apiKey: Joi.string().allow('', null),
  moduleScopes: Joi.array().items(Joi.string().valid('finance', 'hr', 'sales', 'inventory', 'supplyChain', 'manufacturing', 'contacts', 'products', 'reports'))
});

module.exports = { updateAISettingsSchema };