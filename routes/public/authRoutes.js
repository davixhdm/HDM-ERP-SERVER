const express = require('express');
const router = express.Router();
const { login, refreshToken } = require('../../controllers/public/authController');
const { verifyDevice } = require('../../controllers/public/deviceController');
const { authLimiter } = require('../../middleware/public/rateLimiter');

// POST /api/public/auth/login
router.post('/login', authLimiter, login);

// POST /api/public/auth/refresh
router.post('/refresh', refreshToken);

// POST /api/public/auth/verify-device
router.post('/verify-device', authLimiter, verifyDevice);

module.exports = router;