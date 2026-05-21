const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  type: {
    type: String,
    enum: ['customer', 'supplier', 'partner'],
    required: true
  },
  companyName: String,
  contactPerson: String,
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: 'Kenya' }
  },
  taxId: String,
  notes: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

contactSchema.index({ tenantId: 1, type: 1 });
contactSchema.index({ tenantId: 1, email: 1 });

module.exports = mongoose.model('Contact', contactSchema);