const Account = require('../../models/tenant/Account');
const JournalEntry = require('../../models/tenant/JournalEntry');
const Invoice = require('../../models/tenant/Invoice');
const Bill = require('../../models/tenant/Bill');
const Payment = require('../../models/tenant/Payment');
const Tenant = require('../../models/master/Tenant');
const sendEmail = require('../../utils/sendEmail');
const logger = require('../../utils/logger');

// ==================== ACCOUNTS ====================
const getAccounts = async (req, res) => {
  try { const accounts = await Account.find({ tenantId: req.tenantId }); res.json({ success: true, data: accounts }); }
  catch (err) { logger.error('Get accounts error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};
const createAccount = async (req, res) => {
  try {
    const { code, name, type, description, openingBalance } = req.body;
    const existing = await Account.findOne({ tenantId: req.tenantId, code });
    if (existing) return res.status(400).json({ success: false, message: 'Account code already exists' });
    const account = await Account.create({ tenantId: req.tenantId, code, name, type, description, openingBalance: openingBalance || 0, currentBalance: openingBalance || 0 });
    res.status(201).json({ success: true, data: account });
  } catch (err) { logger.error('Create account error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};
const updateAccount = async (req, res) => {
  try {
    const account = await Account.findOneAndUpdate({ _id: req.params.id, tenantId: req.tenantId }, req.body, { new: true });
    if (!account) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: account });
  } catch (err) { logger.error('Update account error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};
const deleteAccount = async (req, res) => {
  try { await Account.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId }); res.json({ success: true, message: 'Deleted' }); }
  catch (err) { logger.error('Delete account error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};

// ==================== JOURNAL ====================
const getJournals = async (req, res) => {
  try { const entries = await JournalEntry.find({ tenantId: req.tenantId }).sort({ date: -1 }); res.json({ success: true, data: entries }); }
  catch (err) { logger.error('Get journals error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};
const createJournal = async (req, res) => {
  try {
    const { date, description, reference, lines } = req.body;
    let totalDebit = 0, totalCredit = 0;
    lines.forEach(line => { totalDebit += line.debit || 0; totalCredit += line.credit || 0; });
    if (Math.abs(totalDebit - totalCredit) > 0.001) return res.status(400).json({ success: false, message: 'Debits must equal credits' });
    const entry = await JournalEntry.create({ tenantId: req.tenantId, entryNumber: `JE-${Date.now()}`, date, description, reference, lines, totalDebit, totalCredit, status: 'posted', source: 'manual', createdBy: req.user._id });
    for (const line of lines) { await Account.findOneAndUpdate({ _id: line.account, tenantId: req.tenantId }, { $inc: { currentBalance: (line.debit || 0) - (line.credit || 0) } }); }
    res.status(201).json({ success: true, data: entry });
  } catch (err) { logger.error('Create journal error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};
const updateJournal = async (req, res) => {
  try {
    const entry = await JournalEntry.findOneAndUpdate({ _id: req.params.id, tenantId: req.tenantId }, req.body, { new: true });
    if (!entry) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: entry });
  } catch (err) { logger.error('Update journal error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};
const deleteJournal = async (req, res) => {
  try {
    await JournalEntry.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { logger.error('Delete journal error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};

// ==================== INVOICES ====================
const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ tenantId: req.tenantId })
      .populate('customer', 'companyName email contactEmail')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: invoices });
  } catch (err) {
    logger.error('Get invoices error:', err.message);
    res.status(500).json({ success: false, message: 'Error' });
  }
};

const createInvoice = async (req, res) => {
  try {
    const { customer, customerName, invoiceDate, dueDate, items, notes } = req.body;
    const invoiceNumber = `INV-${Date.now()}`;
    const computedItems = items.map(item => ({ ...item, total: item.quantity * item.unitPrice }));
    const subtotal = computedItems.reduce((s, i) => s + i.total, 0);
    const taxTotal = computedItems.reduce((s, i) => s + (i.total * (i.taxRate || 0) / 100), 0);
    const grandTotal = subtotal + taxTotal;
    const invoice = await Invoice.create({
      tenantId: req.tenantId, invoiceNumber,
      customer: customer || null, customerName: customerName || '',
      invoiceDate, dueDate, items: computedItems, subtotal, taxTotal, grandTotal,
      status: 'draft', notes, createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    logger.error('Create invoice error:', err.message);
    res.status(500).json({ success: false, message: 'Error' });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const { items, ...rest } = req.body;
    const updateData = { ...rest };
    if (items) {
      const computedItems = items.map(item => ({ ...item, total: item.quantity * item.unitPrice }));
      const subtotal = computedItems.reduce((s, i) => s + i.total, 0);
      const taxTotal = computedItems.reduce((s, i) => s + (i.total * (i.taxRate || 0) / 100), 0);
      updateData.items = computedItems;
      updateData.subtotal = subtotal;
      updateData.taxTotal = taxTotal;
      updateData.grandTotal = subtotal + taxTotal;
    }
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId }, updateData, { new: true }
    );
    if (!invoice) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: invoice });
  } catch (err) {
    logger.error('Update invoice error:', err.message);
    res.status(500).json({ success: false, message: 'Error' });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    await Invoice.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    logger.error('Delete invoice error:', err.message);
    res.status(500).json({ success: false, message: 'Error' });
  }
};

const updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!invoice) return res.status(404).json({ success: false, message: 'Not found' });

    invoice.status = status;

    if (status === 'paid') {
      const cashAccount = await Account.findOne({ tenantId: req.tenantId, type: 'asset' });
      const revenueAccount = await Account.findOne({ tenantId: req.tenantId, type: 'income' });
      if (cashAccount && revenueAccount) {
        await JournalEntry.create({
          tenantId: req.tenantId, entryNumber: `JE-INV-${invoice.invoiceNumber}`, date: new Date(),
          description: `Payment for ${invoice.invoiceNumber}`,
          lines: [
            { account: cashAccount._id, debit: invoice.grandTotal, credit: 0, description: 'Cash' },
            { account: revenueAccount._id, debit: 0, credit: invoice.grandTotal, description: 'Revenue' }
          ],
          totalDebit: invoice.grandTotal, totalCredit: invoice.grandTotal,
          status: 'posted', source: 'invoice', sourceId: invoice._id
        });
        await Account.findByIdAndUpdate(cashAccount._id, { $inc: { currentBalance: invoice.grandTotal } });
        await Account.findByIdAndUpdate(revenueAccount._id, { $inc: { currentBalance: invoice.grandTotal } });
      }
    }

    await invoice.save();

    // Send email only if transitioning to 'sent'
    if (status === 'sent') {
      try {
        const tenant = await Tenant.findById(req.tenantId);
        const customerEmail = tenant?.contactEmail;
        const customerName = invoice.customerName || 'Customer';

        if (customerEmail) {
          const itemsRows = (invoice.items || []).map((item, i) =>
            `<tr>
              <td style="padding:8px;border:1px solid #e5e7eb;">${i + 1}</td>
              <td style="padding:8px;border:1px solid #e5e7eb;">${item.description}</td>
              <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
              <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${(item.unitPrice || 0).toLocaleString()}</td>
              <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString()}</td>
            </tr>`
          ).join('');

          await sendEmail({
            to: customerEmail,
            toName: customerName,
            subject: `Invoice ${invoice.invoiceNumber} from ${tenant?.companyName || 'HDM ERP'}`,
            htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px;border:1px solid #e5e7eb;border-radius:8px;">
              <div style="background:#10B981;padding:16px;text-align:center;border-radius:8px 8px 0 0;margin:-20px -20px 20px -20px;">
                <h2 style="color:#fff;margin:0;font-size:18px;">INVOICE</h2>
              </div>
              <p style="font-size:14px;">Dear <strong>${customerName}</strong>,</p>
              <p style="font-size:13px;color:#4b5563;">Please find your invoice below:</p>
              <table style="width:100%;margin:10px 0;font-size:13px;">
                <tr><td><strong>Invoice #:</strong></td><td>${invoice.invoiceNumber}</td></tr>
                <tr><td><strong>Date:</strong></td><td>${new Date(invoice.invoiceDate).toLocaleDateString()}</td></tr>
                <tr><td><strong>Due Date:</strong></td><td>${new Date(invoice.dueDate).toLocaleDateString()}</td></tr>
              </table>
              <table style="width:100%;border-collapse:collapse;margin:15px 0;font-size:12px;">
                <thead><tr style="background:#f3f4f6;"><th style="padding:8px;border:1px solid #e5e7eb;">#</th><th style="padding:8px;border:1px solid #e5e7eb;">Item</th><th style="padding:8px;border:1px solid #e5e7eb;">Qty</th><th style="padding:8px;border:1px solid #e5e7eb;">Price</th><th style="padding:8px;border:1px solid #e5e7eb;">Total</th></tr></thead>
                <tbody>${itemsRows}</tbody>
              </table>
              <p style="text-align:right;font-size:16px;font-weight:bold;color:#10B981;">Total: ${(invoice.grandTotal || 0).toLocaleString()}</p>
              ${invoice.notes ? `<p style="font-size:12px;color:#6b7280;"><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
              <p style="color:#9ca3af;font-size:11px;margin-top:20px;text-align:center;">Thank you for your business — ${tenant?.companyName || 'HDM ERP'}</p>
            </div>`,
          });
          logger.info(`Invoice email sent to ${customerEmail} for ${invoice.invoiceNumber}`);
        }
      } catch (e) {
        logger.warn(`Invoice email failed for ${invoice.invoiceNumber}: ${e.message}`);
      }
    }

    // Send receipt when paid
    if (status === 'paid') {
      try {
        const tenant = await Tenant.findById(req.tenantId);
        const customerEmail = tenant?.contactEmail;
        if (customerEmail) {
          await sendEmail({
            to: customerEmail,
            toName: invoice.customerName || 'Customer',
            subject: `Payment Received — Invoice ${invoice.invoiceNumber}`,
            htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px;border:1px solid #e5e7eb;border-radius:8px;">
              <div style="background:#10B981;padding:16px;text-align:center;border-radius:8px 8px 0 0;margin:-20px -20px 20px -20px;">
                <h2 style="color:#fff;margin:0;font-size:18px;">✅ Payment Received</h2>
              </div>
              <p style="font-size:14px;">Dear <strong>${invoice.customerName || 'Customer'}</strong>,</p>
              <p style="font-size:13px;color:#4b5563;">Thank you for your payment!</p>
              <table style="width:100%;margin:15px 0;font-size:13px;">
                <tr><td><strong>Invoice #:</strong></td><td>${invoice.invoiceNumber}</td></tr>
                <tr><td><strong>Amount Paid:</strong></td><td style="font-weight:bold;color:#10B981;">${(invoice.grandTotal || 0).toLocaleString()}</td></tr>
                <tr><td><strong>Date:</strong></td><td>${new Date().toLocaleDateString()}</td></tr>
              </table>
              <p style="color:#9ca3af;font-size:11px;margin-top:20px;text-align:center;">${tenant?.companyName || 'HDM ERP'}</p>
            </div>`,
          });
          logger.info(`Receipt email sent to ${customerEmail} for ${invoice.invoiceNumber}`);
        }
      } catch (e) {
        logger.warn(`Receipt email failed for ${invoice.invoiceNumber}: ${e.message}`);
      }
    }

    res.json({ success: true, data: invoice });
  } catch (err) {
    logger.error('Update invoice status error:', err.message);
    res.status(500).json({ success: false, message: 'Error' });
  }
};

// ==================== BILLS ====================
const getBills = async (req, res) => {
  try { const bills = await Bill.find({ tenantId: req.tenantId }).populate('supplier', 'companyName').sort({ createdAt: -1 }); res.json({ success: true, data: bills }); }
  catch (err) { logger.error('Get bills error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};
const createBill = async (req, res) => {
  try {
    const { supplier, supplierName, billDate, dueDate, reference, items, notes } = req.body;
    const billNumber = `BILL-${Date.now()}`;
    const computedItems = items.map(item => ({ ...item, total: item.quantity * item.unitPrice }));
    const subtotal = computedItems.reduce((s, i) => s + i.total, 0);
    const bill = await Bill.create({ tenantId: req.tenantId, billNumber, supplier: supplier || null, supplierName: supplierName || '', billDate, dueDate, reference, items: computedItems, subtotal, grandTotal: subtotal, status: 'draft', notes, createdBy: req.user._id });
    res.status(201).json({ success: true, data: bill });
  } catch (err) { logger.error('Create bill error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};
const updateBill = async (req, res) => {
  try {
    const { items, ...rest } = req.body;
    const updateData = { ...rest };
    if (items) {
      const computedItems = items.map(item => ({ ...item, total: item.quantity * item.unitPrice }));
      updateData.items = computedItems;
      updateData.subtotal = computedItems.reduce((s, i) => s + i.total, 0);
      updateData.grandTotal = updateData.subtotal;
    }
    const bill = await Bill.findOneAndUpdate({ _id: req.params.id, tenantId: req.tenantId }, updateData, { new: true });
    if (!bill) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: bill });
  } catch (err) { logger.error('Update bill error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};
const deleteBill = async (req, res) => {
  try {
    await Bill.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { logger.error('Delete bill error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};
const updateBillStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const bill = await Bill.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!bill) return res.status(404).json({ success: false, message: 'Not found' });
    bill.status = status;
    if (status === 'paid') {
      const cashAccount = await Account.findOne({ tenantId: req.tenantId, type: 'asset' });
      const expenseAccount = await Account.findOne({ tenantId: req.tenantId, type: 'expense' });
      if (cashAccount && expenseAccount) {
        await JournalEntry.create({ tenantId: req.tenantId, entryNumber: `JE-BILL-${bill.billNumber}`, date: new Date(), description: `Payment for ${bill.billNumber}`, lines: [{ account: expenseAccount._id, debit: bill.grandTotal, credit: 0, description: 'Expense' }, { account: cashAccount._id, debit: 0, credit: bill.grandTotal, description: 'Cash' }], totalDebit: bill.grandTotal, totalCredit: bill.grandTotal, status: 'posted', source: 'bill', sourceId: bill._id });
        await Account.findByIdAndUpdate(cashAccount._id, { $inc: { currentBalance: -bill.grandTotal } });
        await Account.findByIdAndUpdate(expenseAccount._id, { $inc: { currentBalance: bill.grandTotal } });
      }
    }
    await bill.save();
    res.json({ success: true, data: bill });
  } catch (err) { logger.error('Update bill status error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};

// ==================== REVENUE / EXPENSES ====================
const recordRevenue = async (req, res) => {
  try {
    const { account, payerPayee, amount, paymentMethod, date, notes } = req.body;
    const payment = await Payment.create({ tenantId: req.tenantId, type: 'income', account, amount, paymentMethod, payerPayee, date, notes, createdBy: req.user._id });
    const cashAccount = await Account.findOne({ tenantId: req.tenantId, type: 'asset' });
    const incomeAccount = await Account.findById(account);
    if (cashAccount && incomeAccount) {
      await JournalEntry.create({ tenantId: req.tenantId, entryNumber: `JE-REV-${Date.now()}`, date: date || new Date(), description: `Revenue from ${payerPayee}`, lines: [{ account: cashAccount._id, debit: amount, credit: 0 }, { account: incomeAccount._id, debit: 0, credit: amount }], totalDebit: amount, totalCredit: amount, status: 'posted', source: 'other', sourceId: payment._id });
      await Account.findByIdAndUpdate(cashAccount._id, { $inc: { currentBalance: amount } });
      await Account.findByIdAndUpdate(incomeAccount._id, { $inc: { currentBalance: amount } });
    }
    res.status(201).json({ success: true, data: payment });
  } catch (err) { logger.error('Record revenue error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};
const recordExpense = async (req, res) => {
  try {
    const { account, payerPayee, amount, paymentMethod, date, notes } = req.body;
    const payment = await Payment.create({ tenantId: req.tenantId, type: 'expense', account, amount, paymentMethod, payerPayee, date, notes, createdBy: req.user._id });
    const cashAccount = await Account.findOne({ tenantId: req.tenantId, type: 'asset' });
    const expenseAccount = await Account.findById(account);
    if (cashAccount && expenseAccount) {
      await JournalEntry.create({ tenantId: req.tenantId, entryNumber: `JE-EXP-${Date.now()}`, date: date || new Date(), description: `Expense to ${payerPayee}`, lines: [{ account: expenseAccount._id, debit: amount, credit: 0 }, { account: cashAccount._id, debit: 0, credit: amount }], totalDebit: amount, totalCredit: amount, status: 'posted', source: 'other', sourceId: payment._id });
      await Account.findByIdAndUpdate(cashAccount._id, { $inc: { currentBalance: -amount } });
      await Account.findByIdAndUpdate(expenseAccount._id, { $inc: { currentBalance: amount } });
    }
    res.status(201).json({ success: true, data: payment });
  } catch (err) { logger.error('Record expense error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};
const getRevenueExpenses = async (req, res) => {
  try {
    const payments = await Payment.find({ tenantId: req.tenantId }).sort({ createdAt: -1 }).populate('account', 'name code');
    res.json({ success: true, data: payments });
  } catch (err) { logger.error('Get revenue/expenses error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};

// ==================== FINANCIAL REPORTS ====================
const getProfitLoss = async (req, res) => {
  try {
    const [revenueAgg, expenseAgg, paidInvoices, paidBills] = await Promise.all([
      Payment.aggregate([{ $match: { tenantId: req.tenantId, type: 'income' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { tenantId: req.tenantId, type: 'expense' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Invoice.aggregate([{ $match: { tenantId: req.tenantId, status: 'paid' } }, { $group: { _id: null, total: { $sum: '$grandTotal' } } }]),
      Bill.aggregate([{ $match: { tenantId: req.tenantId, status: 'paid' } }, { $group: { _id: null, total: { $sum: '$grandTotal' } } }]),
    ]);
    const revenue = (revenueAgg[0]?.total || 0) + (paidInvoices[0]?.total || 0);
    const expenses = (expenseAgg[0]?.total || 0) + (paidBills[0]?.total || 0);
    res.json({ success: true, data: { revenue, expenses, profit: revenue - expenses } });
  } catch (err) { logger.error('P&L error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};

const getBalanceSheet = async (req, res) => {
  try {
    const accounts = await Account.find({ tenantId: req.tenantId });
    const assets = accounts.filter(a => a.type === 'asset').reduce((s, a) => s + (a.currentBalance || 0), 0);
    const liabilities = accounts.filter(a => a.type === 'liability').reduce((s, a) => s + (a.currentBalance || 0), 0);
    const equity = accounts.filter(a => a.type === 'equity').reduce((s, a) => s + (a.currentBalance || 0), 0) + (assets - liabilities);
    res.json({ success: true, data: { assets, liabilities, equity, accounts } });
  } catch (err) { logger.error('BS error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};

const getTrialBalance = async (req, res) => {
  try {
    const accounts = await Account.find({ tenantId: req.tenantId });
    const totalDebit = accounts.filter(a => ['asset', 'expense', 'cost_of_sales'].includes(a.type)).reduce((s, a) => s + (a.currentBalance || 0), 0);
    const totalCredit = accounts.filter(a => ['liability', 'equity', 'income'].includes(a.type)).reduce((s, a) => s + (a.currentBalance || 0), 0);
    res.json({ success: true, data: { totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 0.001, accounts } });
  } catch (err) { logger.error('TB error:', err.message); res.status(500).json({ success: false, message: 'Error' }); }
};

module.exports = {
  getAccounts, createAccount, updateAccount, deleteAccount,
  getJournals, createJournal, updateJournal, deleteJournal,
  getInvoices, createInvoice, updateInvoice, deleteInvoice, updateInvoiceStatus,
  getBills, createBill, updateBill, deleteBill, updateBillStatus,
  recordRevenue, recordExpense, getRevenueExpenses,
  getProfitLoss, getBalanceSheet, getTrialBalance
};