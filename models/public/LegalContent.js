const mongoose = require('mongoose');

const legalContentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['privacy_policy', 'terms_of_service', 'license_agreement', 'cookie_policy'],
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('LegalContent', legalContentSchema);