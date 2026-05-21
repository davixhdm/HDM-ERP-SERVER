const express = require('express');
const router = express.Router();
const { login, refreshToken } = require('../../controllers/admin/authController');

// POST /api/admin/auth/login
router.post('/login', login);

// POST /api/admin/auth/refresh
router.post('/refresh', refreshToken);

module.exports = router;