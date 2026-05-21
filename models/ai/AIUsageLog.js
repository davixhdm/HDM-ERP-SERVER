const mongoose = require('mongoose');

const aiUsageLogSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  query: String,
  tokensUsed: {
    type: Number,
    default: 0
  },
  provider: String,
  cost: Number,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

aiUsageLogSchema.index({ tenantId: 1, timestamp: -1 });

module.exports = mongoose.model('AIUsageLog', aiUsageLogSchema);