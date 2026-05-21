const Joi = require('joi');

const inviteUserSchema = Joi.object({
  email: Joi.string().email().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  role: Joi.string().valid('company_admin', 'accountant', 'hr_manager', 'sales_manager', 'inventory_manager', 'staff').default('staff')
});

const updateUserSchema = Joi.object({
  firstName: Joi.string(),
  lastName: Joi.string(),
  role: Joi.string().valid('company_admin', 'accountant', 'hr_manager', 'sales_manager', 'inventory_manager', 'staff'),
  isActive: Joi.boolean()
});

module.exports = { inviteUserSchema, updateUserSchema };