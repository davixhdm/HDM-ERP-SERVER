const mongoose = require('mongoose');

const backupRecordSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['system', 'tenant'],
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null
  },
  sizeBytes: Number,
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  errorMessage: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

backupRecordSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BackupRecord', backupRecordSchema);