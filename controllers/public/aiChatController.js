const aiLandingService = require('../../services/aiLandingService');
const AIConfig = require('../../models/ai/AIConfig');
const logger = require('../../utils/logger');

/**
 * @desc    Get chatbot config (enabled status)
 * @route   GET /api/public/chatbot/config
 * @access  Public
 */
const getChatbotConfig = async (req, res) => {
  try {
    const config = await AIConfig.findOne();
    const enabled = config?.features?.landingPageAI && config?.landingChatbot?.enabled;
    res.json({
      success: true,
      data: {
        enabled,
        botName: config?.landingChatbot?.botName || 'HDM Assistant',
        welcomeMessage: config?.landingChatbot?.welcomeMessage || 'Hello! How can I help you?',
        color: config?.landingChatbot?.color || '#10B981',
        position: config?.landingChatbot?.position || 'bottom-right'
      }
    });
  } catch (err) {
    logger.error('Chatbot config error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Landing page AI chatbot
 * @route   POST /api/public/chatbot
 * @access  Public
 */
const chat = async (req, res) => {
  try {
    const config = await AIConfig.findOne();
    if (!config || !config.features.landingPageAI || !config.landingChatbot.enabled) {
      return res.status(403).json({ success: false, message: 'Chatbot is currently disabled' });
    }

    const { question } = req.body;
    if (!question) return res.status(400).json({ success: false, message: 'Question required' });

    const reply = await aiLandingService.handleLandingChat(question);
    res.json({ success: true, data: reply });
  } catch (err) {
    logger.error('Chatbot error:', err.message);
    res.status(500).json({ success: false, message: 'Chatbot unavailable' });
  }
};

module.exports = { getChatbotConfig, chat };