const Contact = require('../../models/tenant/Contact');
const logger = require('../../utils/logger');

/**
 * @desc    Get all contacts
 * @route   GET /api/tenant/contacts
 * @access  Private (Tenant)
 */
const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({ tenantId: req.tenantId });
    res.json({ success: true, data: contacts });
  } catch (err) {
    logger.error('Get contacts error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Create contact
 * @route   POST /api/tenant/contacts
 * @access  Private (Tenant)
 */
const createContact = async (req, res) => {
  try {
    const contact = await Contact.create({ tenantId: req.tenantId, ...req.body });
    res.status(201).json({ success: true, data: contact });
  } catch (err) {
    logger.error('Create contact error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Update contact
 * @route   PUT /api/tenant/contacts/:id
 * @access  Private (Tenant)
 */
const updateContact = async (req, res) => {
  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      req.body,
      { new: true }
    );
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    res.json({ success: true, data: contact });
  } catch (err) {
    logger.error('Update contact error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Delete contact
 * @route   DELETE /api/tenant/contacts/:id
 * @access  Private (Tenant)
 */
const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    res.json({ success: true, message: 'Contact deleted' });
  } catch (err) {
    logger.error('Delete contact error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getContacts, createContact, updateContact, deleteContact };