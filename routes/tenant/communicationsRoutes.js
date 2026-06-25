const express = require('express');
const router = express.Router();
const {
  getCommunications, createCommunication,
  updateCommunication, deleteCommunication, sendCommunication
} = require('../../controllers/tenant/communicationsController');

router.get('/', getCommunications);
router.post('/', createCommunication);
router.put('/:id', updateCommunication);
router.delete('/:id', deleteCommunication);
router.post('/:id/send', sendCommunication);

module.exports = router;