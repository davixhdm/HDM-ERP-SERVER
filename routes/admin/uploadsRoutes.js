const express = require('express');
const router = express.Router();
const { uploadFile, deleteFile } = require('../../controllers/admin/uploadsController');
const { upload, handleUploadError } = require('../../middleware/upload');

// POST /api/admin/uploads
router.post('/', upload.single('file'), handleUploadError, uploadFile);

// DELETE /api/admin/uploads/:publicId
router.delete('/:publicId', deleteFile);

module.exports = router;