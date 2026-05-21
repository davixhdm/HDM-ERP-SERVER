const express = require('express');
const router = express.Router();
const { getAISettings, updateAISettings, generateOutwardKey, getOutwardKeys, revokeOutwardKey, uploadFile } = require('../../controllers/tenant/aiController');
const companyAdminAuth = require('../../middleware/tenant/companyAdmin');
const { planLimit, checkOutwardKeyLimit } = require('../../middleware/tenant/planLimit');
const { upload, handleUploadError } = require('../../middleware/upload');

router.get('/settings', getAISettings);
router.put('/settings', companyAdminAuth, updateAISettings);
router.post('/keys', companyAdminAuth, planLimit('ai'), checkOutwardKeyLimit, generateOutwardKey);
router.get('/keys', companyAdminAuth, getOutwardKeys);
router.delete('/keys/:id', companyAdminAuth, revokeOutwardKey);
router.post('/upload', planLimit('ai'), upload.single('file'), handleUploadError, uploadFile);

module.exports = router;