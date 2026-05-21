const mongoose = require('mongoose');

const salesOrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  description: String,
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  total: { type: Number, required: true }
});

const salesOrderSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  orderNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  customerName: { type: String, default: '' },
  orderDate: { type: Date, default: Date.now },
  expectedDelivery: Date,
  items: [salesOrderItemSchema],
  subtotal: Number,
  discountTotal: Number,
  taxTotal: Number,
  grandTotal: Number,
  status: { type: String, enum: ['draft', 'confirmed', 'processing', 'shipped', 'delivered', 'invoiced', 'paid', 'cancelled'], default: 'draft' },
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

salesOrderSchema.index({ tenantId: 1, status: 1 });
salesOrderSchema.index({ tenantId: 1, customer: 1 });

module.exports = mongoose.model('SalesOrder', salesOrderSchema);