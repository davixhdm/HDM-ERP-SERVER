const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  description: String,
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true }
});

const billSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  billNumber: { type: String, required: true, unique: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  supplierName: { type: String, default: '' },
  billDate: { type: Date, default: Date.now },
  dueDate: Date,
  reference: String,
  items: [billItemSchema],
  subtotal: Number,
  grandTotal: Number,
  status: { type: String, enum: ['draft', 'open', 'paid', 'void'], default: 'draft' },
  journalEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

billSchema.index({ tenantId: 1, status: 1 });
billSchema.index({ tenantId: 1, supplier: 1 });

module.exports = mongoose.model('Bill', billSchema);