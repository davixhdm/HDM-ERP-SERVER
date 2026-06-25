const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  type: {
    type: String,
    enum: ['call', 'email', 'meeting', 'note', 'task'],
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  },
  completed: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

activitySchema.index({ tenantId: 1, leadId: 1 });
activitySchema.index({ tenantId: 1, date: -1 });

module.exports = mongoose.model('Activity', activitySchema);