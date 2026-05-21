const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: String,
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  taxRate: { type: Number, default: 0 },
  total: { type: Number, required: true }
});

const invoiceSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  customerName: { type: String, default: '' },
  invoiceDate: { type: Date, default: Date.now },
  dueDate: Date,
  items: [invoiceItemSchema],
  subtotal: Number,
  taxTotal: Number,
  grandTotal: Number,
  status: { type: String, enum: ['draft', 'sent', 'paid', 'cancelled'], default: 'draft' },
  journalEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

invoiceSchema.index({ tenantId: 1, status: 1 });
invoiceSchema.index({ tenantId: 1, customer: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);