const User = require('../../models/tenant/User');
const { inviteUserSchema, updateUserSchema } = require('../../validators/tenant/userValidator');
const sendEmail = require('../../utils/sendEmail');
const logger = require('../../utils/logger');
const crypto = require('crypto');

/**
 * @desc    Get all users
 * @route   GET /api/tenant/users
 * @access  Private (Company Admin)
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ tenantId: req.tenantId }).select('-password');
    res.json({ success: true, data: users });
  } catch (err) {
    logger.error('Get users error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Invite a user
 * @route   POST /api/tenant/users
 * @access  Private (Company Admin)
 */
const inviteUser = async (req, res) => {
  try {
    const { email, firstName, lastName, role, password } = req.body;

    const existing = await User.findOne({ tenantId: req.tenantId, email });
    if (existing) return res.status(400).json({ success: false, message: 'User already exists' });

    const user = await User.create({
      tenantId: req.tenantId,
      email,
      firstName,
      lastName,
      role: role || 'staff',
      password: password || 'changeme123'
    });

    res.status(201).json({ success: true, data: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
  } catch (err) {
    logger.error('Invite user error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Update a user
 * @route   PUT /api/tenant/users/:id
 * @access  Private (Company Admin)
 */
const updateUser = async (req, res) => {
  try {
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      value,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    logger.error('Update user error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Delete a user
 * @route   DELETE /api/tenant/users/:id
 * @access  Private (Company Admin)
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    logger.error('Delete user error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getUsers, inviteUser, updateUser, deleteUser };