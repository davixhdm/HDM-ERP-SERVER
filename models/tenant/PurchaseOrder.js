const mongoose = require('mongoose');

const purchaseOrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  description: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  }
});

const purchaseOrderSchema = new mongoose.Schema({
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
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  expectedDelivery: Date,
  items: [purchaseOrderItemSchema],
  subtotal: Number,
  grandTotal: Number,
  status: {
    type: String,
    enum: ['draft', 'sent', 'processing', 'delivered', 'cancelled'],
    default: 'draft'
  },
  receivedQuantities: mongoose.Schema.Types.Mixed,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

purchaseOrderSchema.index({ tenantId: 1, status: 1 });
purchaseOrderSchema.index({ tenantId: 1, supplier: 1 });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);