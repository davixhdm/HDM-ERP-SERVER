const mongoose = require('mongoose');

const tenantAISettingsSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    unique: true
  },
  keySource: {
    type: String,
    enum: ['hdm', 'own'],
    default: 'hdm'
  },
  provider: {
    type: String,
    enum: ['openai', 'anthropic', 'deepseek', 'gemini', 'mistral', 'cohere', null],
    default: null
  },
  model: String,
  apiKey: {
    type: String,
    select: false
  },
  moduleScopes: [{
    type: String,
    enum: ['finance', 'hr', 'sales', 'inventory', 'supplyChain', 'manufacturing', 'contacts', 'products', 'reports']
  }]
}, { timestamps: true });

module.exports = mongoose.model('TenantAISettings', tenantAISettingsSchema);