const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  code: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['asset', 'liability', 'equity', 'income', 'expense', 'cost_of_sales']
  },
  description: String,
  openingBalance: {
    type: Number,
    default: 0
  },
  currentBalance: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    default: null
  }
}, { timestamps: true });

accountSchema.index({ tenantId: 1, code: 1 }, { unique: true });
accountSchema.index({ tenantId: 1, type: 1 });

module.exports = mongoose.model('Account', accountSchema);