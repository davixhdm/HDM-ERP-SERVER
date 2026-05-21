const CompanySettings = require('../../models/tenant/CompanySettings');
const Tenant = require('../../models/master/Tenant');
const Plan = require('../../models/master/Plan');
const { updateCompanySchema } = require('../../validators/tenant/companyValidator');
const logger = require('../../utils/logger');

/**
 * @desc    Get company settings
 * @route   GET /api/tenant/company
 * @access  Private (Tenant)
 */
const getSettings = async (req, res) => {
  try {
    let settings = await CompanySettings.findOne({ tenantId: req.tenantId });
    if (!settings) {
      settings = await CompanySettings.create({ tenantId: req.tenantId });
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    logger.error('Get company settings error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Update company settings
 * @route   PUT /api/tenant/company
 * @access  Private (Company Admin)
 */
const updateSettings = async (req, res) => {
  try {
    const { error, value } = updateCompanySchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const settings = await CompanySettings.findOneAndUpdate(
      { tenantId: req.tenantId },
      value,
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, data: settings });
  } catch (err) {
    logger.error('Update company settings error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Get tenant modules and limits from plan
 * @route   GET /api/tenant/company/modules
 * @access  Private (Tenant)
 */
const getModules = async (req, res) => {
  try {
    const tenant = req.tenant || await Tenant.findById(req.tenantId);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

    const plan = await Plan.findOne({ name: tenant.plan });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    res.json({
      success: true,
      data: {
        plan: tenant.plan,
        modules: tenant.modules || plan.modules || {},
        planModules: plan.modules || {},
        limits: plan.limits || {}
      }
    });
  } catch (err) {
    logger.error('Get modules error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Toggle tenant modules
 * @route   PUT /api/tenant/company/modules/toggle
 * @access  Private (Company Admin)
 */
const toggleModules = async (req, res) => {
  try {
    const { modules } = req.body;
    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

    const plan = await Plan.findOne({ name: tenant.plan });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const allowedModules = {};
    Object.keys(modules).forEach(key => {
      if (plan.modules[key] === true) {
        allowedModules[key] = modules[key];
      }
    });

    tenant.modules = { ...tenant.modules.toObject(), ...allowedModules };
    await tenant.save();

    res.json({ success: true, data: { modules: tenant.modules, planModules: plan.modules } });
  } catch (err) {
    logger.error('Toggle modules error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getSettings, updateSettings, getModules, toggleModules };