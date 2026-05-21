const Joi = require('joi');

const manualPaymentSchema = Joi.object({
  transactionId: Joi.string().when('$requireProof', { is: 'transactionId', then: Joi.required() }),
  proof: Joi.any().when('$requireProof', { is: 'upload', then: Joi.required() })
});

module.exports = { manualPaymentSchema };