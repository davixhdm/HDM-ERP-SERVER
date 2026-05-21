const mongoose = require('mongoose');

const journalLineSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  description: String,
  debit: {
    type: Number,
    default: 0
  },
  credit: {
    type: Number,
    default: 0
  }
});

const journalEntrySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  entryNumber: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  description: String,
  reference: String,
  lines: [journalLineSchema],
  totalDebit: {
    type: Number,
    default: 0
  },
  totalCredit: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'posted'],
    default: 'draft'
  },
  source: {
    type: String,
    enum: ['manual', 'invoice', 'bill', 'payroll', 'inventory', 'other'],
    default: 'manual'
  },
  sourceId: mongoose.Schema.Types.ObjectId,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

journalEntrySchema.index({ tenantId: 1, date: -1 });
journalEntrySchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);