const cloudinaryService = require('../../services/cloudinaryService');
const logger = require('../../utils/logger');

/**
 * @desc    Upload file (admin)
 * @route   POST /api/admin/uploads
 * @access  Private (Super Admin)
 */
const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const result = await cloudinaryService.uploadFile(req.file.buffer, 'admin_uploads');
    res.json({ success: true, data: { url: result.secure_url, publicId: result.public_id } });
  } catch (err) {
    logger.error('Upload file error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Delete uploaded file
 * @route   DELETE /api/admin/uploads/:publicId
 * @access  Private (Super Admin)
 */
const deleteFile = async (req, res) => {
  try {
    await cloudinaryService.deleteFile(req.params.publicId);
    res.json({ success: true, message: 'File deleted' });
  } catch (err) {
    logger.error('Delete file error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { uploadFile, deleteFile };