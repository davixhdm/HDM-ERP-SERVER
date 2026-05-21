const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  module: {
    type: String,
    required: true,
    enum: ['finance', 'hr', 'sales', 'inventory', 'supply_chain', 'manufacturing', 'all']
  },
  type: {
    type: String,
    enum: ['tabular', 'chart', 'summary'],
    default: 'tabular'
  },
  description: String,
  config: mongoose.Schema.Types.Mixed,
  isSystem: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

reportSchema.index({ tenantId: 1, module: 1 });

module.exports = mongoose.model('Report', reportSchema);