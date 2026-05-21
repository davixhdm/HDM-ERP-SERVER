const mongoose = require('mongoose');
const crypto = require('crypto');

const outwardAPIKeySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  key: {
    type: String,
    required: true,
    unique: true
  },
  prefix: String,
  scopes: [{
    type: String,
    enum: ['finance', 'hr', 'sales', 'inventory', 'supplyChain', 'manufacturing', 'contacts', 'products', 'reports']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: Date,
  expiresAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

outwardAPIKeySchema.pre('validate', function(next) {
  if (!this.key) {
    this.key = `hdm_sk_${crypto.randomBytes(24).toString('hex')}`;
    this.prefix = 'hdm_sk';
  }
  next();
});

module.exports = mongoose.model('OutwardAPIKey', outwardAPIKeySchema);