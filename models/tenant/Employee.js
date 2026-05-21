const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  phone: String,
  department: String,
  position: String,
  employmentType: {
    type: String,
    enum: ['full_time', 'part_time', 'contract', 'intern'],
    default: 'full_time'
  },
  hireDate: Date,
  terminationDate: Date,
  basicSalary: {
    type: Number,
    default: 0
  },
  allowances: [{
    name: String,
    amount: Number
  }],
  deductions: [{
    name: String,
    amount: Number
  }],
  bankAccount: {
    bankName: String,
    accountNumber: String,
    accountName: String
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

employeeSchema.index({ tenantId: 1, email: 1 }, { unique: true });
employeeSchema.index({ tenantId: 1, department: 1 });

module.exports = mongoose.model('Employee', employeeSchema);