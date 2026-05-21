const mongoose = require('mongoose');

const returnOrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  quantity: Number,
  reason: String,
  unitPrice: Number
});

const returnOrderSchema = new mongoose.Schema({
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
  originalOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder'
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  },
  items: [returnOrderItemSchema],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  totalRefund: Number,
  reason: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

returnOrderSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('ReturnOrder', returnOrderSchema);