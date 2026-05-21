const Employee = require('../../models/tenant/Employee');
const Attendance = require('../../models/tenant/Attendance');
const Leave = require('../../models/tenant/Leave');
const Payroll = require('../../models/tenant/Payroll');
const JournalEntry = require('../../models/tenant/JournalEntry');
const Account = require('../../models/tenant/Account');
const logger = require('../../utils/logger');
const Recruitment = require('../../models/tenant/Recruitment');

/**
 * @desc    Get all employees
 * @route   GET /api/tenant/hr/employees
 * @access  Private (Tenant)
 */
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ tenantId: req.tenantId });
    res.json({ success: true, data: employees });
  } catch (err) {
    logger.error('Get employees error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Add employee
 * @route   POST /api/tenant/hr/employees
 * @access  Private (Tenant)
 */
const addEmployee = async (req, res) => {
  try {
    const employee = await Employee.create({ tenantId: req.tenantId, ...req.body });
    res.status(201).json({ success: true, data: employee });
  } catch (err) {
    logger.error('Add employee error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Update employee
 * @route   PUT /api/tenant/hr/employees/:id
 * @access  Private (Tenant)
 */
const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: employee });
  } catch (err) {
    logger.error('Update employee error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Delete employee
 * @route   DELETE /api/tenant/hr/employees/:id
 * @access  Private (Tenant)
 */
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, message: 'Employee deleted' });
  } catch (err) {
    logger.error('Delete employee error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Mark attendance
 * @route   POST /api/tenant/hr/attendance
 * @access  Private (Tenant)
 */
const markAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.create({ tenantId: req.tenantId, ...req.body });
    res.status(201).json({ success: true, data: attendance });
  } catch (err) {
    logger.error('Mark attendance error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Get attendance records
 * @route   GET /api/tenant/hr/attendance
 * @access  Private (Tenant)
 */
const getAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ tenantId: req.tenantId }).populate('employee');
    res.json({ success: true, data: records });
  } catch (err) {
    logger.error('Get attendance error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Request leave
 * @route   POST /api/tenant/hr/leave
 * @access  Private (Tenant)
 */
const requestLeave = async (req, res) => {
  try {
    const { employee, type, startDate, endDate, reason } = req.body;
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
    const leave = await Leave.create({
      tenantId: req.tenantId,
      employee,
      type: type || 'annual',
      startDate,
      endDate,
      days,
      reason: reason || '',
      status: 'pending'
    });
    res.status(201).json({ success: true, data: leave });
  } catch (err) {
    console.error('REQUEST LEAVE ERROR:', err.message);
    logger.error('Request leave error: ' + (err.message || err));
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Get leave requests
 * @route   GET /api/tenant/hr/leave
 * @access  Private (Tenant)
 */
const getLeave = async (req, res) => {
  try {
    const leaves = await Leave.find({ tenantId: req.tenantId }).populate('employee');
    res.json({ success: true, data: leaves });
  } catch (err) {
    logger.error('Get leave error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Approve or reject leave
 * @route   PUT /api/tenant/hr/leave/:id/status
 * @access  Private (Tenant)
 */
const updateLeaveStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const leave = await Leave.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { status, rejectionReason: status === 'rejected' ? rejectionReason : undefined, approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    );
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
    res.json({ success: true, data: leave });
  } catch (err) {
    logger.error('Update leave status error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Run payroll
 * @route   POST /api/tenant/hr/payroll
 * @access  Private (Tenant)
 */
const runPayroll = async (req, res) => {
  try {
    const { periodStart, periodEnd, paymentDate, items } = req.body;
    const payroll = await Payroll.create({
      tenantId: req.tenantId,
      periodStart,
      periodEnd,
      paymentDate,
      items,
      totalGross: items.reduce((s, i) => s + i.grossPay, 0),
      totalNet: items.reduce((s, i) => s + i.netPay, 0),
      status: 'processed',
      createdBy: req.user._id
    });

    // Journal entry
    const cashAccount = await Account.findOne({ tenantId: req.tenantId, type: 'asset', name: /cash/i });
    const salaryAccount = await Account.findOne({ tenantId: req.tenantId, type: 'expense', name: /salary/i });
    if (cashAccount && salaryAccount) {
      await JournalEntry.create({
        tenantId: req.tenantId,
        entryNumber: `PAY-${Date.now()}`,
        date: paymentDate || new Date(),
        description: 'Payroll',
        lines: [
          { account: salaryAccount._id, debit: payroll.totalNet, credit: 0 },
          { account: cashAccount._id, debit: 0, credit: payroll.totalNet }
        ],
        totalDebit: payroll.totalNet,
        totalCredit: payroll.totalNet,
        status: 'posted',
        source: 'payroll',
        sourceId: payroll._id
      });
      cashAccount.currentBalance -= payroll.totalNet;
      salaryAccount.currentBalance += payroll.totalNet;
      await cashAccount.save();
      await salaryAccount.save();
    }

    res.status(201).json({ success: true, data: payroll });
  } catch (err) {
    logger.error('Run payroll error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Get payroll history
 * @route   GET /api/tenant/hr/payroll
 * @access  Private (Tenant)
 */
const getPayrollHistory = async (req, res) => {
  try {
    const payrolls = await Payroll.find({ tenantId: req.tenantId }).sort({ createdAt: -1 });
    res.json({ success: true, data: payrolls });
  } catch (err) {
    logger.error('Get payroll history error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Post a job
 * @route   POST /api/tenant/hr/recruitment
 * @access  Private (Tenant)
 */
const postJob = async (req, res) => {
  try {
    const job = await Recruitment.create({ tenantId: req.tenantId, ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: job });
  } catch (err) {
    logger.error('Post job error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Get job postings
 * @route   GET /api/tenant/hr/recruitment
 * @access  Private (Tenant)
 */
const getJobs = async (req, res) => {
  try {
    const jobs = await Recruitment.find({ tenantId: req.tenantId }).sort({ createdAt: -1 });
    res.json({ success: true, data: jobs });
  } catch (err) {
    logger.error('Get jobs error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Submit appraisal
 * @route   POST /api/tenant/hr/appraisals
 * @access  Private (Tenant)
 */
const submitAppraisal = async (req, res) => {
  try {
    res.status(201).json({ success: true, message: 'Appraisal submitted', data: req.body });
  } catch (err) {
    logger.error('Submit appraisal error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Get appraisals
 * @route   GET /api/tenant/hr/appraisals
 * @access  Private (Tenant)
 */
const getAppraisals = async (req, res) => {
  try {
    res.json({ success: true, data: [] });
  } catch (err) {
    logger.error('Get appraisals error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getEmployees, addEmployee, updateEmployee, deleteEmployee,
  markAttendance, getAttendance,
  requestLeave, getLeave, updateLeaveStatus,
  runPayroll, getPayrollHistory,
  postJob, getJobs,
  submitAppraisal, getAppraisals
};