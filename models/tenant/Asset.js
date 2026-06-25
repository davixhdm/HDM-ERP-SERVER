const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['equipment', 'vehicle', 'furniture', 'it', 'building', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'retired', 'disposed'],
    default: 'active'
  },
  purchaseDate: {
    type: Date
  },
  purchaseCost: {
    type: Number,
    default: 0
  },
  currentValue: {
    type: Number,
    default: 0
  },
  depreciationMethod: {
    type: String,
    enum: ['straight_line', 'reducing_balance', 'none'],
    default: 'straight_line'
  },
  depreciationRate: {
    type: Number,
    default: 20
  },
  usefulLifeYears: {
    type: Number,
    default: 5
  },
  salvageValue: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    trim: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  supplier: {
    type: String,
    trim: true
  },
  warrantyExpiry: {
    type: Date
  },
  notes: {
    type: String,
    default: ''
  },
  qrCode: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

assetSchema.index({ tenantId: 1, code: 1 }, { unique: true });
assetSchema.index({ tenantId: 1, category: 1 });
assetSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('Asset', assetSchema);