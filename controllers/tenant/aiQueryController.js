const aiGatewayService = require('../../services/aiGatewayService');
const logger = require('../../utils/logger');

/**
 * @desc    Query AI (sparkle button)
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

    const result = await aiGatewayService.tenantQuery(req.tenantId, question, tenantInfo);
    res.json({ success: true, data: result.data || result });
  } catch (err) {
    logger.error('AI query error:', err.message);
    res.status(500).json({ success: false, message: 'AI service unavailable' });
  }
};

module.exports = { queryAI };