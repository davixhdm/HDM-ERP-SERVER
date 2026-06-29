const express = require('express');
const router = express.Router();

router.use('/landing', require('./landingRoutes'));
router.use('/plans', require('./planRoutes'));
router.use('/auth', require('./authRoutes'));
router.use('/activation', require('./activationRoutes'));
router.use('/register', require('./registrationRoutes'));
router.use('/payments', require('./paymentRoutes'));
router.use('/chatbot', require('./aiChatRoutes'));
router.use('/legal', require('./legalRoutes'));
router.use('/renew', require('./renewRoutes'));

module.exports = router;