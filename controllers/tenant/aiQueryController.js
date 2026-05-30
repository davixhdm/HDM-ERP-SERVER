const aiGatewayService = require('../../services/aiGatewayService');
const logger = require('../../utils/logger');
const TenantAISettings = require('../../models/ai/TenantAISettings');

/**
 * @desc    Query AI (sparkle button) — returns both AI reply and raw data
 * @route   POST /api/tenant/ai/query
 * @access  Private (Tenant)
 */
const queryAI = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ success: false, message: 'Question is required' });

    const tenantInfo = {
      companyName: req.tenant?.companyName || 'Tenant',
      plan: req.tenant?.plan || 'standard',
      businessType: 'General'
    };

    // Get module scopes from tenant settings
    const settings = await TenantAISettings.findOne({ tenantId: req.tenantId });
    const scopes = settings?.moduleScopes || ['finance', 'sales', 'hr', 'inventory', 'products', 'contacts'];

    // Fetch raw data
    const rawData = await aiGatewayService.buildContextData(req.tenantId, scopes, question);

    // Get AI analysis
    const result = await aiGatewayService.tenantQuery(req.tenantId, question, tenantInfo);

    res.json({
      success: true,
      data: {
        reply: result?.data?.reply || 'No response',
        provider: result?.data?.provider || 'unknown',
        tokens_used: result?.data?.tokens_used || 0,
        raw_data: rawData
      }
    });
  } catch (err) {
    logger.error('AI query error:', err.message);
    res.status(500).json({ success: false, message: 'AI service unavailable' });
  }
};

module.exports = { queryAI };