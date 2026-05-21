const express = require('express');
const router = express.Router();
const {
  getAccounts, createAccount, updateAccount, deleteAccount,
  getJournals, createJournal,
  getInvoices, createInvoice, updateInvoiceStatus,
  getBills, createBill, updateBillStatus,
  recordRevenue, recordExpense,
  getProfitLoss, getBalanceSheet, getTrialBalance
} = require('../../controllers/tenant/financeController');

router.get('/accounts', getAccounts);
router.post('/accounts', createAccount);
router.put('/accounts/:id', updateAccount);
router.delete('/accounts/:id', deleteAccount);
router.get('/journal', getJournals);
router.post('/journal', createJournal);
router.get('/invoices', getInvoices);
router.post('/invoices', createInvoice);
router.put('/invoices/:id/status', updateInvoiceStatus);
router.get('/bills', getBills);
router.post('/bills', createBill);
router.put('/bills/:id/status', updateBillStatus);
router.post('/revenue', recordRevenue);
router.post('/expenses', recordExpense);
router.get('/reports/profit-loss', getProfitLoss);
router.get('/reports/balance-sheet', getBalanceSheet);
router.get('/reports/trial-balance', getTrialBalance);

module.exports = router;