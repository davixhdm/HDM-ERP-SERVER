const express = require('express');
const router = express.Router();
const { getRenewInfo, processRenew } = require('../../controllers/public/renewController');

router.get('/info', getRenewInfo);
router.post('/pay', processRenew);

module.exports = router;