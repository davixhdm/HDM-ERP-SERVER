const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  plan: {
    type: String,
    enum: ['free_trial', 'standard', 'pro', 'enterprise'],
    required: true
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly', 'permanent'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'active'
  },
  licenseKey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LicenseKey'
  },
  paymentReference: String
}, { timestamps: true });

subscriptionSchema.index({ tenant: 1, status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);