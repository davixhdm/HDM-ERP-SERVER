const mongoose = require('mongoose');

const payrollItemSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  basicPay: Number,
  allowances: [{
    name: String,
    amount: Number
  }],
  deductions: [{
    name: String,
    amount: Number
  }],
  grossPay: Number,
  netPay: Number
});

const payrollSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  paymentDate: Date,
  items: [payrollItemSchema],
  totalGross: Number,
  totalNet: Number,
  status: {
    type: String,
    enum: ['draft', 'processed', 'paid'],
    default: 'draft'
  },
  journalEntry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JournalEntry'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

payrollSchema.index({ tenantId: 1, periodStart: 1, periodEnd: 1 });

module.exports = mongoose.model('Payroll', payrollSchema);