const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  type: {
    type: String,
    enum: ['preventive', 'corrective', 'inspection'],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  completedDate: {
    type: Date
  },
  cost: {
    type: Number,
    default: 0
  },
  vendor: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

maintenanceSchema.index({ tenantId: 1, assetId: 1 });
maintenanceSchema.index({ tenantId: 1, status: 1 });
maintenanceSchema.index({ tenantId: 1, scheduledDate: 1 });

module.exports = mongoose.model('Maintenance', maintenanceSchema);