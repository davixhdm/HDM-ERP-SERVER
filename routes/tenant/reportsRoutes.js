const express = require('express');
const router = express.Router();
const { getReports, saveReport, runReport, deleteReport } = require('../../controllers/tenant/reportsController');
const { checkReportLimit } = require('../../middleware/tenant/planLimit');

// GET /api/tenant/reports
router.get('/', getReports);

// POST /api/tenant/reports (with report limit check)
router.post('/', checkReportLimit, saveReport);

// GET /api/tenant/reports/engine/:id
router.get('/engine/:id', runReport);

// DELETE /api/tenant/reports/:id
router.delete('/:id', deleteReport);

module.exports = router;