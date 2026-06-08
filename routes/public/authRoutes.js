const express = require('express');
const router = express.Router();
const { login, refreshToken, forgotPassword, resetPassword } = require('../../controllers/public/authController');
const { verifyDevice } = require('../../controllers/public/deviceController');
const { authLimiter } = require('../../middleware/public/rateLimiter');

router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);
router.post('/verify-device', authLimiter, verifyDevice);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;