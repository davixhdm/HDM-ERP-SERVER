const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['free_trial', 'standard', 'pro', 'enterprise']
  },
  displayName: {
    type: String,
    required: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  trialDays: {
    type: Number,
    default: 14
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  pricing: {
    monthly: { type: Number, default: 0 },
    yearly: { type: Number, default: 0 },
    permanent: { type: Number, default: 0 },
    stripePriceId: String
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
    aiSparkle: { type: Boolean, default: false },
    aiFileUpload: { type: Boolean, default: false },
    communications: { type: Boolean, default: true },
    outwardApiKeys: { type: Boolean, default: false },
    // ── NEW MODULES ──
    crm: { type: Boolean, default: false },
    projects: { type: Boolean, default: false },
    assets: { type: Boolean, default: false }
  },
  limits: {
    maxUsers: { type: Number, default: 3 },
    maxStorageGB: { type: Number, default: 0.5 },
    maxCustomReports: { type: Number, default: 3 },
    aiWrite: { type: Boolean, default: false },
    aiOutwardKeys: { type: Number, default: 0 },
    whiteLabel: { type: Boolean, default: false },
    multiCompany: { type: Boolean, default: false },
    dedicatedDatabase: { type: Boolean, default: false },
    supportLevel: {
      type: String,
      enum: ['community', 'email_chat', 'dedicated'],
      default: 'community'
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema);