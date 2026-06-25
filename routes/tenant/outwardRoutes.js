const express = require('express');
const router = express.Router();
const outwardApiKeyAuth = require('../../middleware/tenant/apiKeyAuth');
const aiGatewayService = require('../../services/aiGatewayService');
const logger = require('../../utils/logger');

router.use(outwardApiKeyAuth);

/**
 * @desc    Get outward API info
 * @route   GET /api/tenant/ai/outward
 * @access  Public (API Key)
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      tenant: req.tenant?.companyName,
      scopes: req.apiKeyScopes,
      endpoints: {
        query: 'POST /api/tenant/ai/outward/query',
        data: 'POST /api/tenant/ai/outward/data',
        body: { question: 'Your question here (required for query)' }
      }
    }
  });
});

/**
 * @desc    Get raw structured data only (no AI)
 * @route   POST /api/tenant/ai/outward/data
 * @access  Public (API Key)
 */
router.post('/data', async (req, res) => {
  try {
    const scopes = req.apiKeyScopes || [];
    const question = req.body.question || 'sync all data overview fetch';

    logger.info(`Outward data pull from ${req.tenant?.companyName}: scopes=${scopes.join(',')}`);
    const businessData = await aiGatewayService.buildContextData(req.tenantId, scopes, question);

    res.json({ success: true, data: businessData });
  } catch (err) {
    logger.error('Outward data pull error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch data' });
  }
});

/**
 * @desc    Query AI + return both raw data and AI reply
 * @route   POST /api/tenant/ai/outward/query
 * @access  Public (API Key)
 */
router.post('/query', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    const scopes = req.apiKeyScopes || [];
    const tenantInfo = {
      companyName: req.tenant?.companyName || 'Tenant',
      plan: req.tenant?.plan || 'standard',
      businessType: 'General'
    };

    // Fetch raw data FIRST
    const rawData = await aiGatewayService.buildContextData(req.tenantId, scopes, question);

    // Then get AI analysis
    logger.info(`Outward AI query from ${req.tenant?.companyName}: "${question.substring(0, 50)}..."`);
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
    logger.error('Outward AI query error:', err.message);
    res.status(500).json({ success: false, message: 'AI service unavailable' });
  }
});

module.exports = router;