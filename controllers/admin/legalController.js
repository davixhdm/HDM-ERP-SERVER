const LegalContent = require('../../models/public/LegalContent');
const logger = require('../../utils/logger');

/**
 * @desc    Get legal document
 * @route   GET /api/admin/legal/:type
 * @access  Private (Super Admin)
 */
const getLegalDocument = async (req, res) => {
  try {
    const doc = await LegalContent.findOne({ type: req.params.type });
    res.json({ success: true, data: doc || { title: '', content: '' } });
  } catch (err) {
    logger.error('Get legal document error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Update or create legal document
 * @route   PUT /api/admin/legal/:type
 * @access  Private (Super Admin)
 */
const updateLegalDocument = async (req, res) => {
  try {
    const doc = await LegalContent.findOneAndUpdate(
      { type: req.params.type },
      { title: req.body.title, content: req.body.content },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: doc });
  } catch (err) {
    logger.error('Update legal document error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getLegalDocument, updateLegalDocument };