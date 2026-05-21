const mongoose = require('mongoose');

const workOrderSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  bom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BillOfMaterial'
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  scheduledStart: Date,
  scheduledEnd: Date,
  actualStart: Date,
  actualEnd: Date,
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'processing', 'completed', 'cancelled'],
    default: 'draft'
  },
  outputQuantity: {
    type: Number,
    default: 0
  },
  scrapQuantity: {
    type: Number,
    default: 0
  },
  qualityStatus: {
    type: String,
    enum: ['pending', 'passed', 'failed'],
    default: 'pending'
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

workOrderSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('WorkOrder', workOrderSchema);