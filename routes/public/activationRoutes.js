const express = require('express');
const router = express.Router();
const { activateAccount } = require('../../controllers/public/activationController');

// POST /api/public/activation
router.post('/', activateAccount);

module.exports = router;