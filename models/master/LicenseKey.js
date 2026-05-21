const mongoose = require('mongoose');

const licenseKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  plan: String,
  issuedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  revokedAt: Date,
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { timestamps: true });

module.exports = mongoose.model('LicenseKey', licenseKeySchema);