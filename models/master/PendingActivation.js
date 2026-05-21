const mongoose = require('mongoose');

const pendingActivationSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  contactEmail: { type: String, required: true, lowercase: true },
  contactPhone: { type: String, default: '' },
  password: { type: String, default: '' },
  fullName: { type: String, default: '' },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null },
  plan: { type: String, enum: ['free_trial', 'standard', 'pro', 'enterprise'], required: true },
  billingCycle: { type: String, enum: ['monthly', 'yearly', 'permanent'], default: 'monthly' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  displayCurrency: { type: String, default: 'KSh' },
  paymentMethod: { type: String, default: 'manual' },
  paymentConfirmed: { type: Boolean, default: false },
  proofFile: String,
  transactionId: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: String,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  reviewedAt: Date,
  expiresAt: { type: Date, required: true, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }
}, { timestamps: true });

pendingActivationSchema.index({ status: 1 });
pendingActivationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PendingActivation', pendingActivationSchema);