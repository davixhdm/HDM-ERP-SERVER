const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  general: {
    systemName: { type: String, default: 'HDM ERP' },
    tagline: { type: String, default: 'Smart Business Management Powered by AI' },
    contactEmail: { type: String, default: 'support@hdmerp.com' },
    contactPhone: { type: String, default: '+254 700 000 000' },
    address: { type: String, default: 'Nairobi, Kenya' },
    timezone: { type: String, default: 'Africa/Nairobi' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    defaultLanguage: { type: String, default: 'en' },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: 'We are currently performing scheduled maintenance. Please check back soon.' }
  },
  branding: {
    logoNavbar: { type: String, default: '' },
    logoFavicon: { type: String, default: '' },
    primaryColor: { type: String, default: '#10B981' },
    secondaryColor: { type: String, default: '#1E3A5F' }
  },
  landingPage: {
    heroHeadline: { type: String, default: 'Smart Business Management' },
    heroSubtext: { type: String, default: 'Manage your entire business from one platform' },
    moduleTags: [{ type: String }],
    launchButtonLabel: { type: String, default: 'Launch' },
    registerButtonLabel: { type: String, default: 'Get Started' },
    aboutText: { type: String, default: '' },
    footer: {
      copyright: { type: String, default: '' },
      privacyPolicyUrl: { type: String, default: '' },
      termsOfServiceUrl: { type: String, default: '' },
      licenseUrl: { type: String, default: '' },
      supportEmail: { type: String, default: '' },
      supportPhone: { type: String, default: '' }
    }
  },
  payments: {
    stripe: { enabled: { type: Boolean, default: false } },
    mpesa: {
      enabled: { type: Boolean, default: false },
      stkPush: { type: Boolean, default: false },
      sendMoney: { enabled: { type: Boolean, default: false }, phoneNumber: { type: String, default: '' } },
      paybill: { enabled: { type: Boolean, default: false }, businessNumber: { type: String, default: '' }, accountName: { type: String, default: '' } },
      till: { enabled: { type: Boolean, default: false }, tillNumber: { type: String, default: '' }, businessName: { type: String, default: '' } }
    },
    paypal: { enabled: { type: Boolean, default: false } },
    currency: { type: String, default: 'KSh' },
    requireProof: { type: Boolean, default: false }
  },
  uploads: {
    maxFileSizeMB: { type: Number, default: 10 },
    allowedTypes: { type: [String], default: ['image/png', 'image/jpeg', 'application/pdf'] }
  },
  downloads: {
    desktop: { enabled: { type: Boolean, default: false }, url: { type: String, default: '' }, label: { type: String, default: '' } },
    mobile: { enabled: { type: Boolean, default: false }, url: { type: String, default: '' }, label: { type: String, default: '' } }
  }
}, { timestamps: true, strict: false });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);