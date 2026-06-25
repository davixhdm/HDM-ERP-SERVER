const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  legalName: {
    type: String,
    trim: true
  },
  subdomain: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true
  },
  plan: {
    type: String,
    enum: ['free_trial', 'standard', 'pro', 'enterprise'],
    default: 'free_trial'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'deleted', 'pending'],
    default: 'pending'
  },
  contactEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  contactPhone: String,
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: 'Kenya' }
  },
  taxId: String,
  registrationNumber: String,
  currency: {
    type: String,
    default: 'KSh',
    enum: ['KSh', 'USD', 'EUR', 'GBP']
  },
modules: {
    finance: { type: Boolean, default: true },
    hr: { type: Boolean, default: true },
    sales: { type: Boolean, default: true },
    inventory: { type: Boolean, default: true },
    supplyChain: { type: Boolean, default: true },
    orders: { type: Boolean, default: true },
    manufacturing: { type: Boolean, default: false },
    contacts: { type: Boolean, default: true },
    products: { type: Boolean, default: true },
    reports: { type: Boolean, default: true },
    settings: { type: Boolean, default: true },
    dashboard: { type: Boolean, default: true },
    landingPage: { type: Boolean, default: true },
    communications: { type: Boolean, default: true },
    crm: { type: Boolean, default: false },
    projects: { type: Boolean, default: false },
    assets: { type: Boolean, default: false },
    aiSparkle: { type: Boolean, default: false },
    aiFileUpload: { type: Boolean, default: false },
    outwardApiKeys: { type: Boolean, default: false }
  },
  subscriptionExpiry: Date,
  trialEndDate: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { timestamps: true });

tenantSchema.index({ status: 1 });
tenantSchema.index({ plan: 1 });

module.exports = mongoose.model('Tenant', tenantSchema);