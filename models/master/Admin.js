const mongoose = require('mongoose');
const { hashPassword } = require('../../utils/hashPassword');

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'super_admin',
    enum: ['super_admin']
  },
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await hashPassword(this.password);
  next();
});

module.exports = mongoose.model('Admin', adminSchema);