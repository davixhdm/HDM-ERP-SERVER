const multer = require('multer');
const path = require('path');
const logger = require('../utils/logger');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/json'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    logger.warn(`Upload rejected: ${file.mimetype} not allowed`);
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB default
  }
});

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    logger.warn(`Multer error: ${err.message}`);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    logger.warn(`Upload error: ${err.message}`);
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

module.exports = { upload, handleUploadError };