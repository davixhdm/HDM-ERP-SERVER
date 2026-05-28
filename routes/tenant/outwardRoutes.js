const express = require('express');
const router = express.Router();
const outwardApiKeyAuth = require('../../middleware/tenant/apiKeyAuth');
const aiGatewayService = require('../../services/aiGatewayService');
const logger = require('../../utils/logger');

// All outward routes use API key auth, not JWT
router.use(outwardApiKeyAuth);

// POST /api/tenant/ai/outward/query
router.post('/query', async (req, res) => {
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
    logger.error('Outward AI query error:', err.message);
    res.status(500).json({ success: false, message: 'AI service unavailable' });
  }
});

// GET /api/tenant/ai/outward/
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      tenant: req.tenant?.companyName,
      scopes: req.apiKeyScopes,
      endpoints: {
        query: 'POST /api/tenant/ai/outward/query',
        body: { question: 'Your question here' }
      }
    }
  });
});

module.exports = router;