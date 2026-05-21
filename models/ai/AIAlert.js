const mongoose = require('mongoose');

const aiAlertSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  type: {
    type: String,
    enum: ['low_stock', 'overdue_invoice', 'unusual_activity', 'cash_flow', 'other']
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info'
  },
  message: String,
  data: mongoose.Schema.Types.Mixed,
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

aiAlertSchema.index({ tenantId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('AIAlert', aiAlertSchema);