const LegalContent = require('../../models/public/LegalContent');
const logger = require('../../utils/logger');

/**
 * @desc    Get legal document by type
 * @route   GET /api/public/legal/:type
 * @access  Public
 */
const getLegalDocument = async (req, res) => {
  try {
    const doc = await LegalContent.findOne({ type: req.params.type });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    logger.error('Get legal document error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getLegalDocument };