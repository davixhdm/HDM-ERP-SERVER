const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  type: {
    type: String,
    enum: ['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'other'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  days: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reason: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String
}, { timestamps: true });

leaveSchema.index({ tenantId: 1, employee: 1, status: 1 });

module.exports = mongoose.model('Leave', leaveSchema);