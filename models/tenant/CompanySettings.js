const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    unique: true
  },
  companyName: String,
  legalName: String,
  taxId: String,
  registrationNumber: String,
  currency: {
    type: String,
    default: 'KSh',
    enum: ['KSh', 'USD', 'EUR', 'GBP']
  },
  contactEmail: String,
  contactPhone: String,
  website: String,
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: 'Kenya' }
  },
  logo: String
}, { timestamps: true });

module.exports = mongoose.model('CompanySettings', companySettingsSchema);