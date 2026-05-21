const logger = require('../utils/logger');

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req[source], {
        abortEarly: false,
        stripUnknown: true,
        context: { requireProof: req.body?.requireProof || null }
      });

      if (error) {
        const messages = error.details.map(d => d.message).join(', ');
        logger.warn(`Validation failed: ${messages}`);
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
        });
      }

      req[source] = value;
      next();
    } catch (err) {
      logger.error(`Validator middleware error: ${err.message}`);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
};

module.exports = { validate };