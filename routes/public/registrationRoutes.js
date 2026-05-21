const express = require('express');
const router = express.Router();
const { register } = require('../../controllers/public/registrationController');

// POST /api/public/register
router.post('/', register);

module.exports = router;