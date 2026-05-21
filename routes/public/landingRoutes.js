const express = require('express');
const router = express.Router();
const { getLandingConfig } = require('../../controllers/public/landingController');

// GET /api/public/landing
router.get('/', getLandingConfig);

module.exports = router;