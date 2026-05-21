const express = require('express');
const router = express.Router();
const {
  getEmployees, addEmployee, updateEmployee, deleteEmployee,
  markAttendance, getAttendance,
  requestLeave, getLeave, updateLeaveStatus,
  runPayroll, getPayrollHistory,
  postJob, getJobs,
  submitAppraisal, getAppraisals
} = require('../../controllers/tenant/hrController');

// Employees
router.get('/employees', getEmployees);
router.post('/employees', addEmployee);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);

// Attendance
router.post('/attendance', markAttendance);
router.get('/attendance', getAttendance);

// Leave
router.post('/leave', requestLeave);
router.get('/leave', getLeave);
router.put('/leave/:id/status', updateLeaveStatus);

// Payroll
router.post('/payroll', runPayroll);
router.get('/payroll', getPayrollHistory);
router.delete('/payroll/:id', async (req, res) => {
  try {
    const Payroll = require('../../models/tenant/Payroll');
    await Payroll.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: 'Error' }); }
});

// Recruitment
router.get('/recruitment', getJobs);
router.post('/recruitment', postJob);
router.put('/recruitment/:id', async (req, res) => {
  try {
    const Recruitment = require('../../models/tenant/Recruitment');
    const job = await Recruitment.findOneAndUpdate({ _id: req.params.id, tenantId: req.tenantId }, req.body, { new: true });
    if (!job) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: job });
  } catch (err) { res.status(500).json({ success: false, message: 'Error' }); }
});
router.put('/recruitment/:id/close', async (req, res) => {
  try {
    const Recruitment = require('../../models/tenant/Recruitment');
    await Recruitment.findOneAndUpdate({ _id: req.params.id, tenantId: req.tenantId }, { status: 'closed' });
    res.json({ success: true, message: 'Closed' });
  } catch (err) { res.status(500).json({ success: false, message: 'Error' }); }
});
router.delete('/recruitment/:id', async (req, res) => {
  try {
    const Recruitment = require('../../models/tenant/Recruitment');
    await Recruitment.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: 'Error' }); }
});

// Appraisals
router.post('/appraisals', submitAppraisal);
router.get('/appraisals', getAppraisals);

module.exports = router;