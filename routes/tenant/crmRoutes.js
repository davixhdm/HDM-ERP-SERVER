const express = require('express');
const router = express.Router();
const {
  getLeads, getLead, createLead, updateLead, deleteLead, updateLeadStage, convertLead,
  getActivities, createActivity, updateActivity, deleteActivity,
  getCRMStats
} = require('../../controllers/tenant/crmController');

// Leads
router.get('/leads', getLeads);
router.get('/leads/:id', getLead);
router.post('/leads', createLead);
router.put('/leads/:id', updateLead);
router.delete('/leads/:id', deleteLead);
router.put('/leads/:id/stage', updateLeadStage);
router.post('/leads/:id/convert', convertLead);

// Activities
router.get('/activities', getActivities);
router.post('/activities', createActivity);
router.put('/activities/:id', updateActivity);
router.delete('/activities/:id', deleteActivity);

// Stats
router.get('/stats', getCRMStats);

module.exports = router;