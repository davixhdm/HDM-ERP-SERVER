const Joi = require('joi');

const activateSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).max(128).required()
});

module.exports = { activateSchema };