const mongoose = require('mongoose');

const trustedDeviceSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  deviceName: String,
  ipAddress: String,
  lastUsed: {
    type: Date,
    default: Date.now
  },
  isTrusted: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

trustedDeviceSchema.index({ tenantId: 1, userId: 1, deviceId: 1 }, { unique: true });

module.exports = mongoose.model('TrustedDevice', trustedDeviceSchema);