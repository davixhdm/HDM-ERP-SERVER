const Lead = require('../../models/tenant/Lead');
const Activity = require('../../models/tenant/Activity');
const Contact = require('../../models/tenant/Contact');
const logger = require('../../utils/logger');

// ==================== LEADS ====================

const getLeads = async (req, res) => {
  try {
    const { stage, assignedTo, search, page = 1, limit = 50 } = req.query;
    const filter = { tenantId: req.tenantId };
    if (stage && stage !== 'all') filter.stage = stage;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [leads, total] = await Promise.all([
      Lead.find(filter).populate('assignedTo', 'firstName lastName email').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Lead.countDocuments(filter)
    ]);

    res.json({ success: true, data: leads, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    logger.error('Get leads error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, tenantId: req.tenantId })
      .populate('assignedTo', 'firstName lastName email')
      .populate('convertedToCustomer', 'companyName email phone');
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (err) {
    logger.error('Get lead error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createLead = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, company, source, value, notes, assignedTo, nextFollowUp } = req.body;
    if (!firstName || !lastName) return res.status(400).json({ success: false, message: 'First and last name required' });

    const lead = await Lead.create({
      tenantId: req.tenantId,
      firstName, lastName, email, phone, company, source, stage: 'lead',
      value: value || 0, notes, assignedTo, nextFollowUp,
      createdBy: req.user._id
    });

    const populated = await Lead.findById(lead._id).populate('assignedTo', 'firstName lastName email');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    logger.error('Create lead error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      req.body,
      { new: true }
    ).populate('assignedTo', 'firstName lastName email');
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (err) {
    logger.error('Update lead error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    await Activity.deleteMany({ leadId: lead._id });
    res.json({ success: true, message: 'Lead and associated activities deleted' });
  } catch (err) {
    logger.error('Delete lead error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateLeadStage = async (req, res) => {
  try {
    const { stage } = req.body;
    if (!['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].includes(stage)) {
      return res.status(400).json({ success: false, message: 'Invalid stage' });
    }
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { stage },
      { new: true }
    ).populate('assignedTo', 'firstName lastName email');
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    // Log activity
    await Activity.create({
      tenantId: req.tenantId,
      leadId: lead._id,
      type: 'note',
      subject: `Stage changed to ${stage}`,
      description: `Lead moved from pipeline stage.`,
      createdBy: req.user._id
    });

    res.json({ success: true, data: lead });
  } catch (err) {
    logger.error('Update lead stage error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const convertLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    if (lead.stage === 'won') return res.status(400).json({ success: false, message: 'Lead already converted' });

    // Create contact
    const contact = await Contact.create({
      tenantId: req.tenantId,
      type: 'customer',
      companyName: lead.company || `${lead.firstName} ${lead.lastName}`,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      createdBy: req.user._id
    });

    // Update lead
    lead.stage = 'won';
    lead.convertedToCustomer = contact._id;
    await lead.save();

    // Log activity
    await Activity.create({
      tenantId: req.tenantId,
      leadId: lead._id,
      type: 'note',
      subject: 'Lead converted to customer',
      description: `Contact created: ${contact.companyName}`,
      createdBy: req.user._id
    });

    const populated = await Lead.findById(lead._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('convertedToCustomer', 'companyName email phone');

    res.json({ success: true, data: populated, contact });
  } catch (err) {
    logger.error('Convert lead error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ==================== ACTIVITIES ====================

const getActivities = async (req, res) => {
  try {
    const { leadId } = req.query;
    const filter = { tenantId: req.tenantId };
    if (leadId) filter.leadId = leadId;

    const activities = await Activity.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort({ date: -1 });

    res.json({ success: true, data: activities });
  } catch (err) {
    logger.error('Get activities error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createActivity = async (req, res) => {
  try {
    const { leadId, type, subject, description, date, completed } = req.body;
    if (!leadId || !type || !subject) return res.status(400).json({ success: false, message: 'leadId, type, and subject required' });

    const activity = await Activity.create({
      tenantId: req.tenantId,
      leadId, type, subject, description, date, completed,
      createdBy: req.user._id
    });

    const populated = await Activity.findById(activity._id).populate('createdBy', 'firstName lastName');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    logger.error('Create activity error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateActivity = async (req, res) => {
  try {
    const activity = await Activity.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      req.body,
      { new: true }
    ).populate('createdBy', 'firstName lastName');
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
    res.json({ success: true, data: activity });
  } catch (err) {
    logger.error('Update activity error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
    res.json({ success: true, message: 'Activity deleted' });
  } catch (err) {
    logger.error('Delete activity error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ==================== STATS ====================

const getCRMStats = async (req, res) => {
  try {
    const leads = await Lead.find({ tenantId: req.tenantId });
    const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
    const stageCounts = {};
    let totalValue = 0;
    let wonValue = 0;

    stages.forEach(s => { stageCounts[s] = 0; });

    leads.forEach(l => {
      stageCounts[l.stage] = (stageCounts[l.stage] || 0) + 1;
      totalValue += l.value || 0;
      if (l.stage === 'won') wonValue += l.value || 0;
    });

    const conversionRate = leads.length > 0 ? Math.round((stageCounts.won / leads.length) * 100) : 0;

    res.json({
      success: true,
      data: {
        total: leads.length,
        stageCounts,
        totalValue,
        wonValue,
        conversionRate
      }
    });
  } catch (err) {
    logger.error('Get CRM stats error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getLeads, getLead, createLead, updateLead, deleteLead, updateLeadStage, convertLead,
  getActivities, createActivity, updateActivity, deleteActivity,
  getCRMStats
};