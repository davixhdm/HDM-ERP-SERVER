const express = require('express');
const router = express.Router();
const {
  getAccounts, createAccount, updateAccount, deleteAccount,
  getJournals, createJournal, updateJournal, deleteJournal,
  getInvoices, createInvoice, updateInvoice, deleteInvoice, updateInvoiceStatus,
  getBills, createBill, updateBill, deleteBill, updateBillStatus,
  recordRevenue, recordExpense, getRevenueExpenses,
  getProfitLoss, getBalanceSheet, getTrialBalance
} = require('../../controllers/tenant/financeController');

// Accounts
router.get('/accounts', getAccounts);
router.post('/accounts', createAccount);
router.put('/accounts/:id', updateAccount);
router.delete('/accounts/:id', deleteAccount);

// Journal
router.get('/journal', getJournals);
router.post('/journal', createJournal);
router.put('/journal/:id', updateJournal);
router.delete('/journal/:id', deleteJournal);

// Invoices
router.get('/invoices', getInvoices);
router.post('/invoices', createInvoice);
router.put('/invoices/:id', updateInvoice);
router.delete('/invoices/:id', deleteInvoice);
router.put('/invoices/:id/status', updateInvoiceStatus);

// Bills
router.get('/bills', getBills);
router.post('/bills', createBill);
router.put('/bills/:id', updateBill);
router.delete('/bills/:id', deleteBill);
router.put('/bills/:id/status', updateBillStatus);

// Revenue & Expenses
router.post('/revenue', recordRevenue);
router.post('/expenses', recordExpense);
router.get('/revenue-expenses', getRevenueExpenses);

// Reports
router.get('/reports/profit-loss', getProfitLoss);
router.get('/reports/balance-sheet', getBalanceSheet);
router.get('/reports/trial-balance', getTrialBalance);

module.exports = router;