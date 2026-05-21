const express = require('express');
const router = express.Router();
const { getApprovals, approvePayment, rejectPayment, deleteApproval } = require('../../controllers/admin/approvalsController');

router.get('/', getApprovals);
router.put('/:id/approve', approvePayment);
router.put('/:id/reject', rejectPayment);
router.delete('/:id', deleteApproval);

module.exports = router;