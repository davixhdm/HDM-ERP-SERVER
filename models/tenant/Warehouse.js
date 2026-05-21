const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
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
  address: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

warehouseSchema.index({ tenantId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Warehouse', warehouseSchema);