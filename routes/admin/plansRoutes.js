const express = require('express');
const router = express.Router();
const { getPlans, createPlan, updatePlan, deletePlan } = require('../../controllers/admin/plansController');

// GET /api/admin/plans
router.get('/', getPlans);

// POST /api/admin/plans
router.post('/', createPlan);

// PUT /api/admin/plans/:id
router.put('/:id', updatePlan);

// DELETE /api/admin/plans/:id
router.delete('/:id', deletePlan);

module.exports = router;