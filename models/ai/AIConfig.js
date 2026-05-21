const mongoose = require('mongoose');

const aiConfigSchema = new mongoose.Schema({
  provider: {
    type: String,
    default: 'hdm-ai',
    enum: ['hdm-ai', 'openai', 'anthropic', 'deepseek', 'gemini', 'mistral', 'cohere']
  },
  model: {
    type: String,
    default: 'hdm-default'
  },
  baseUrl: {
    type: String,
    default: 'https://hdmai-server.onrender.com/api/v1'
  },
  apiKey: {
    type: String,
    default: 'hdm_erp_f10c05018a390678378c40dbb110f6c6e09963eeebc111f6'
  },
  features: {
    landingPageAI: { type: Boolean, default: true },
    clientAI: { type: Boolean, default: true },
    proactiveAlerts: { type: Boolean, default: true },
    fileUpload: { type: Boolean, default: true },
    outwardKeyGen: { type: Boolean, default: true },
    maxFileSizeMB: { type: Number, default: 5 }
  },
  landingChatbot: {
    enabled: { type: Boolean, default: true },
    provider: { type: String, default: 'hdm-ai' },
    model: { type: String, default: 'hdm-default' },
    apiKey: { type: String, default: 'hdm_erp_f10c05018a390678378c40dbb110f6c6e09963eeebc111f6' },
    botName: { type: String, default: 'HDM Assistant' },
    welcomeMessage: { type: String, default: 'Hello! How can I help you today?' },
    color: { type: String, default: '#10B981' },
    position: { type: String, enum: ['bottom-right', 'bottom-left'], default: 'bottom-right' }
  }
}, { timestamps: true });

module.exports = mongoose.model('AIConfig', aiConfigSchema);