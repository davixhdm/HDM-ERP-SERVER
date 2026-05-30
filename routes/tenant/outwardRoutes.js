const express = require('express');
const router = express.Router();
const outwardApiKeyAuth = require('../../middleware/tenant/apiKeyAuth');
const aiGatewayService = require('../../services/aiGatewayService');
const logger = require('../../utils/logger');

// All outward routes use API key auth, not JWT
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
        body: {
          question: 'Your question here (required)'
        }
      },
      usage: {
        curl: `curl -H "x-api-key: YOUR_KEY" -X POST ${req.protocol}://${req.get('host')}/api/tenant/ai/outward/query -H "Content-Type: application/json" -d '{"question":"What is my revenue?"}'`,
        header: 'x-api-key: YOUR_API_KEY',
        contentType: 'application/json'
      }
    }
  });
});

/**
 * @desc    Query AI with outward API key
 * @route   POST /api/tenant/ai/outward/query
 * @access  Public (API Key)
 */
router.post('/query', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Question is required',
        usage: { body: { question: 'Your question here' } }
      });
    }

    const tenantInfo = {
      companyName: req.tenant?.companyName || 'Tenant',
      plan: req.tenant?.plan || 'standard',
      businessType: 'General'
    };

    logger.info(`Outward AI query from ${req.tenant?.companyName}: "${question.substring(0, 50)}..."`);
    const result = await aiGatewayService.tenantQuery(req.tenantId, question, tenantInfo);

    res.json({
      success: true,
      data: {
        reply: result?.data?.reply || 'No response',
        provider: result?.data?.provider || 'unknown',
        tokens_used: result?.data?.tokens_used || 0,
        data_analyzed: result?.data?.data_analyzed || false
      }
    });
  } catch (err) {
    logger.error('Outward AI query error:', err.message);
    const statusCode = err.response?.status || 500;
    const message = err.response?.data?.message || err.message || 'AI service unavailable';
    res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;