const mongoose = require('mongoose');

const landingPageConfigSchema = new mongoose.Schema({
  heroHeadline: { type: String, default: 'Smart Business Management' },
  heroSubtext: { type: String, default: 'Manage your entire business from one platform' },
  moduleTags: [{ type: String }],
  launchButtonLabel: { type: String, default: 'Launch' },
  registerButtonLabel: { type: String, default: 'Get Started' },
  aboutText: String,
  footer: {
    copyright: String,
    privacyPolicyUrl: String,
    termsOfServiceUrl: String,
    licenseUrl: String,
    supportEmail: String,
    supportPhone: String
  },
  paymentMethods: [String],
  locations: [String],
  contacts: {
    email: String,
    phone: String
  },
  features: [String],
  pricingSummary: String,
  faqs: {
    questions: [{
      q: String,
      a: String
    }]
  }
}, { timestamps: true, strict: false });

module.exports = mongoose.model('LandingPageConfig', landingPageConfigSchema);