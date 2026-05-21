const Joi = require('joi');

const approveSchema = Joi.object({
  // No extra fields needed
});

const rejectSchema = Joi.object({
  reason: Joi.string().required()
});

module.exports = { approveSchema, rejectSchema };