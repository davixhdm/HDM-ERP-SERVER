const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  reference: String,
  payerPayee: String,
  date: {
    type: Date,
    default: Date.now
  },
  journalEntry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JournalEntry'
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

paymentSchema.index({ tenantId: 1, type: 1, date: -1 });

module.exports = mongoose.model('Payment', paymentSchema);