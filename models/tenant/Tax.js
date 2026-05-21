const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  type: {
    type: String,
    enum: ['sales', 'purchase', 'both'],
    default: 'sales'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

taxSchema.index({ tenantId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Tax', taxSchema);