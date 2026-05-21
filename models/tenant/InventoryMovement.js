const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse'
  },
  type: {
    type: String,
    enum: ['receipt', 'issue', 'transfer_in', 'transfer_out', 'adjustment', 'return', 'production', 'consumption'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unitCost: {
    type: Number,
    default: 0
  },
  totalCost: Number,
  reference: String,
  sourceId: mongoose.Schema.Types.ObjectId,
  sourceType: String,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

inventoryMovementSchema.index({ tenantId: 1, product: 1, createdAt: -1 });
inventoryMovementSchema.index({ tenantId: 1, warehouse: 1 });

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);