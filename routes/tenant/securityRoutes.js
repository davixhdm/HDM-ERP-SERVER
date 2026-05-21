const express = require('express');
const router = express.Router();
const { getTrustedDevices, removeTrustedDevice, changePassword } = require('../../controllers/tenant/securityController');

// Devices
router.get('/devices', getTrustedDevices);
router.delete('/devices/:id', removeTrustedDevice);

// Password change
router.put('/password', changePassword);

module.exports = router;