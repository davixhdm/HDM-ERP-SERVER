const express = require('express');
const router = express.Router();
const { sendCustomEmail, getRecipients } = require('../../controllers/admin/emailController');

router.get('/recipients', getRecipients);
router.post('/send', sendCustomEmail);

module.exports = router;