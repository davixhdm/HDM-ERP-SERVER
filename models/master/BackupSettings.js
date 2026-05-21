const mongoose = require('mongoose');

const backupSettingsSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: false
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    default: 'daily'
  },
  time: {
    type: String,
    default: '02:00'
  },
  cronExpression: String,
  retention: {
    keepDays: { type: Number, default: 30 },
    maxBackups: { type: Number, default: 10 }
  },
  emailDelivery: {
    enabled: { type: Boolean, default: false },
    emailAddresses: [{ type: String }],
    attachFile: { type: Boolean, default: false }
  }
}, { timestamps: true });

module.exports = mongoose.model('BackupSettings', backupSettingsSchema);