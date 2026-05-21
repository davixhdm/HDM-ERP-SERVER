const AIConfig = require('../../models/ai/AIConfig');
const logger = require('../../utils/logger');

/**
 * @desc    Get global AI configuration
 * @route   GET /api/admin/ai
 * @access  Private (Super Admin)
 */
const getAIConfig = async (req, res) => {
  try {
    let config = await AIConfig.findOne();
    if (!config) {
      config = await AIConfig.create({});
    }
    res.json({ success: true, data: config });
  } catch (err) {
    logger.error('Get AI config error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Update global AI configuration
 * @route   PUT /api/admin/ai
 * @access  Private (Super Admin)
 */
const updateAIConfig = async (req, res) => {
  try {
    let config = await AIConfig.findOne();
    if (!config) {
      config = new AIConfig(req.body);
      await config.save();
      return res.json({ success: true, data: config });
    }

    // Deep merge to preserve existing keys
    const body = req.body;
    if (body.provider !== undefined) config.provider = body.provider;
    if (body.model !== undefined) config.model = body.model;
    if (body.baseUrl !== undefined) config.baseUrl = body.baseUrl;
    if (body.apiKey !== undefined) config.apiKey = body.apiKey;

    if (body.features) {
      Object.keys(body.features).forEach(key => {
        config.features[key] = body.features[key];
      });
    }

    if (body.landingChatbot) {
      Object.keys(body.landingChatbot).forEach(key => {
        config.landingChatbot[key] = body.landingChatbot[key];
      });
    }

    await config.save();
    res.json({ success: true, data: config });
  } catch (err) {
    logger.error('Update AI config error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getAIConfig, updateAIConfig };