const axios = require('axios');
const AIConfig = require('../models/ai/AIConfig');
const TenantAISettings = require('../models/ai/TenantAISettings');
const Tenant = require('../models/master/Tenant');
const Plan = require('../models/master/Plan');
const AIUsageLog = require('../models/ai/AIUsageLog');
const config = require('../config/env');
const logger = require('../utils/logger');

const getTenantAIConfig = async (tenantId) => {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant || tenant.status !== 'active') throw new Error('Tenant not active');

  const plan = await Plan.findOne({ name: tenant.plan });
  if (!plan || !plan.modules.aiSparkle) throw new Error('AI not available on your plan');

  const aiConfig = await AIConfig.findOne();
  if (!aiConfig || !aiConfig.features.clientAI) throw new Error('AI disabled by administrator');

  const settings = await TenantAISettings.findOne({ tenantId });
  const useOwnKey = settings?.keySource === 'own' && settings?.apiKey;

  if (useOwnKey) {
    return { provider: settings.provider, model: settings.model, baseUrl: getBaseUrlForProvider(settings.provider), apiKey: settings.apiKey, moduleScopes: settings.moduleScopes || [] };
  }
  return { provider: aiConfig.provider, model: aiConfig.model, baseUrl: aiConfig.baseUrl || config.hdmAi.baseUrl, apiKey: aiConfig.apiKey || config.hdmAi.apiKey, moduleScopes: settings?.moduleScopes || [] };
};

const getBaseUrlForProvider = (provider) => {
  const providers = { 'hdm-ai': config.hdmAi.baseUrl || 'https://hdmai-server.onrender.com/api/v1', 'openai': 'https://api.openai.com/v1', 'anthropic': 'https://api.anthropic.com/v1', 'deepseek': 'https://api.deepseek.com/v1', 'gemini': 'https://generativelanguage.googleapis.com/v1beta', 'mistral': 'https://api.mistral.ai/v1', 'cohere': 'https://api.cohere.ai/v1' };
  return providers[provider] || '';
};

const buildContextData = async (tenantId, moduleScopes, question = '') => {
  const msg = (question || '').toLowerCase();
  const tenant = await Tenant.findById(tenantId);
  const currency = tenant?.currency || 'KSh';
  const fmt = (amount) => `${currency} ${(amount || 0).toLocaleString()}`;

  const generalQueries = ['health', 'overview', 'business', 'performance', 'report', 'summary', 'all', 'everything', 'sync', 'analyze', 'dashboard'];
  const isGeneralQuery = generalQueries.some(q => msg.includes(q)) || !msg || msg.length < 5;
  const shouldInclude = (keywords) => isGeneralQuery || keywords.some(k => msg.includes(k));

  const data = { summary: { currency } };

  if (moduleScopes.includes('finance')) {
    const Invoice = require('../models/tenant/Invoice');
    const Bill = require('../models/tenant/Bill');
    const Payment = require('../models/tenant/Payment');
    const Account = require('../models/tenant/Account');
    const [invoices, bills, payments, accounts] = await Promise.all([Invoice.find({ tenantId }).sort({ createdAt: -1 }).limit(50).lean(), Bill.find({ tenantId }).sort({ createdAt: -1 }).limit(50).lean(), Payment.find({ tenantId }).sort({ createdAt: -1 }).limit(50).lean(), Account.find({ tenantId }).lean()]);

    data.invoices = invoices.map(i => ({ number: i.invoiceNumber, customer: i.customerName || 'N/A', amount: i.grandTotal, amount_formatted: fmt(i.grandTotal), status: i.status, date: i.invoiceDate }));
    data.bills = bills.map(b => ({ number: b.billNumber, supplier: b.supplierName || 'N/A', amount: b.grandTotal, amount_formatted: fmt(b.grandTotal), status: b.status, date: b.billDate }));
    data.payments = payments.map(p => ({ type: p.type, payerPayee: p.payerPayee, amount: p.amount, amount_formatted: fmt(p.amount), method: p.paymentMethod, date: p.date }));
    data.accounts = accounts.map(a => ({ name: a.name, type: a.type, balance: a.currentBalance, balance_formatted: fmt(a.currentBalance) }));

    const paidInv = invoices.filter(i => i.status === 'paid');
    const unpaidInv = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled');
    const paidBills = bills.filter(b => b.status === 'paid');
    const unpaidBills = bills.filter(b => b.status !== 'paid' && b.status !== 'void');
    const incomePmt = payments.filter(p => p.type === 'income');
    const expensePmt = payments.filter(p => p.type === 'expense');
    const tr = paidInv.reduce((s, i) => s + (i.grandTotal || 0), 0) + incomePmt.reduce((s, p) => s + (p.amount || 0), 0);
    const pr = unpaidInv.reduce((s, i) => s + (i.grandTotal || 0), 0);
    const te = paidBills.reduce((s, b) => s + (b.grandTotal || 0), 0) + expensePmt.reduce((s, p) => s + (p.amount || 0), 0);
    const pe = unpaidBills.reduce((s, b) => s + (b.grandTotal || 0), 0);
    data.summary.totalRevenue = tr; data.summary.totalRevenue_formatted = fmt(tr);
    data.summary.pendingRevenue = pr; data.summary.pendingRevenue_formatted = fmt(pr);
    data.summary.totalExpenses = te; data.summary.totalExpenses_formatted = fmt(te);
    data.summary.pendingExpenses = pe; data.summary.pendingExpenses_formatted = fmt(pe);
    data.summary.netProfit = tr - te; data.summary.netProfit_formatted = fmt(tr - te);
    data.summary.paidInvoices = paidInv.length; data.summary.unpaidInvoices = unpaidInv.length;
    data.summary.paidBills = paidBills.length; data.summary.unpaidBills = unpaidBills.length;
  }

  if ((moduleScopes.includes('inventory') || moduleScopes.includes('products')) && shouldInclude(['stock', 'inventory', 'product', 'low', 'reorder'])) {
    const Product = require('../models/tenant/Product');
    const Warehouse = require('../models/tenant/Warehouse');
    const [products, warehouses] = await Promise.all([Product.find({ tenantId, isActive: true }).lean(), Warehouse.find({ tenantId }).lean()]);
    data.products = products.map(p => ({ name: p.name, sku: p.sku, stock: p.stock || 0, unit: p.unit, costPrice: p.costPrice, costPrice_formatted: fmt(p.costPrice), sellingPrice: p.sellingPrice, sellingPrice_formatted: fmt(p.sellingPrice), reorderLevel: p.reorderLevel }));
    data.warehouses = warehouses.map(w => ({ name: w.name, code: w.code }));
    data.summary.totalProducts = products.length;
    data.summary.totalStock = products.reduce((s, p) => s + (p.stock || 0), 0);
    data.summary.lowStockItems = products.filter(p => (p.stock || 0) <= (p.reorderLevel || 0)).length;
    data.summary.lowStockList = products.filter(p => (p.stock || 0) <= (p.reorderLevel || 0)).map(p => p.name);
  }

  if (moduleScopes.includes('sales') && shouldInclude(['sale', 'order', 'revenue', 'customer', 'quotation'])) {
    const SalesOrder = require('../models/tenant/SalesOrder');
    const orders = await SalesOrder.find({ tenantId }).sort({ createdAt: -1 }).limit(20).lean();
    data.salesOrders = orders.map(o => ({ number: o.orderNumber, customer: o.customerName || 'N/A', total: o.grandTotal, total_formatted: fmt(o.grandTotal), status: o.status, date: o.orderDate }));
    data.summary.totalSalesOrders = orders.length;
    data.summary.pendingOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
  }

  if (moduleScopes.includes('hr') && shouldInclude(['employee', 'staff', 'payroll', 'salary', 'attendance', 'leave'])) {
    const Employee = require('../models/tenant/Employee');
    const employees = await Employee.find({ tenantId, isActive: true }).lean();
    data.employees = employees.map(e => ({ name: `${e.firstName} ${e.lastName}`, department: e.department, position: e.position, salary: e.basicSalary, salary_formatted: fmt(e.basicSalary) }));
    const tp = employees.reduce((s, e) => s + (e.basicSalary || 0), 0);
    data.summary.totalEmployees = employees.length;
    data.summary.totalPayroll = tp; data.summary.totalPayroll_formatted = fmt(tp);
  }

  if (moduleScopes.includes('contacts') && shouldInclude(['customer', 'supplier', 'contact', 'partner'])) {
    const Contact = require('../models/tenant/Contact');
    const contacts = await Contact.find({ tenantId }).lean();
    data.customers = contacts.filter(c => c.type === 'customer').map(c => ({ name: c.companyName, email: c.email, phone: c.phone }));
    data.suppliers = contacts.filter(c => c.type === 'supplier').map(c => ({ name: c.companyName, email: c.email, phone: c.phone }));
    data.summary.totalCustomers = data.customers.length;
    data.summary.totalSuppliers = data.suppliers.length;
  }

  if (moduleScopes.includes('supplyChain') && shouldInclude(['purchase', 'supplier', 'po', 'procurement', 'requisition'])) {
    const PurchaseOrder = require('../models/tenant/PurchaseOrder');
    const pos = await PurchaseOrder.find({ tenantId }).sort({ createdAt: -1 }).limit(20).lean();
    data.purchaseOrders = pos.map(po => ({ number: po.orderNumber, supplier: po.supplierName || 'N/A', total: po.grandTotal, total_formatted: fmt(po.grandTotal), status: po.status, date: po.orderDate }));
    data.summary.totalPurchaseOrders = pos.length;
  }

  if (moduleScopes.includes('manufacturing') && shouldInclude(['manufacturing', 'work order', 'production', 'qc', 'bom'])) {
    const WorkOrder = require('../models/tenant/WorkOrder');
    const workOrders = await WorkOrder.find({ tenantId }).sort({ createdAt: -1 }).limit(20).lean();
    data.workOrders = workOrders.map(wo => ({ number: wo.orderNumber, product: wo.product?.name || 'N/A', quantity: wo.quantity, status: wo.status, output: wo.outputQuantity, qcStatus: wo.qualityStatus }));
    data.summary.totalWorkOrders = workOrders.length;
    data.summary.completedWorkOrders = workOrders.filter(wo => wo.status === 'completed').length;
  }

  return data;
};

const tenantQuery = async (tenantId, question, tenantInfo) => {
  const { provider, model, baseUrl, apiKey, moduleScopes } = await getTenantAIConfig(tenantId);
  const businessData = await buildContextData(tenantId, moduleScopes, question);
  const tenant = await Tenant.findById(tenantId);
  const currency = tenant?.currency || 'KSh';

  const payload = {
    query: `${question}\n\n(Note: Display all monetary amounts in ${currency}. The data includes raw numbers and _formatted versions like ${currency} 38,300.)`,
    tenant_id: tenantId.toString(),
    context: { source: 'tenant', tenant_info: { name: tenantInfo?.companyName || 'Tenant', plan: tenantInfo?.plan || 'standard', business_type: tenantInfo?.businessType || 'General', currency } },
    data: businessData
  };

  const response = await axios.post(`${baseUrl}/erp/query`, payload, { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 30000 });
  await AIUsageLog.create({ tenantId, query: question, tokensUsed: response.data?.data?.tokens_used || 0, provider, timestamp: new Date() });
  return response.data;
};

const landingQuery = async (question, landingConfig) => {
  const aiConfig = await AIConfig.findOne();
  const chatbot = aiConfig?.landingChatbot || {};
  if (!aiConfig?.features?.landingPageAI || !chatbot.enabled) throw new Error('Chatbot disabled');
  const baseUrl = chatbot.provider === 'hdm-ai' ? config.hdmAi.baseUrl : getBaseUrlForProvider(chatbot.provider);
  const apiKey = chatbot.apiKey || config.hdmAi.apiKey;
  const payload = { query: question, tenant_id: 'landing', context: { source: 'landing', payment_methods: landingConfig?.paymentMethods?.join(', ') || '', locations: landingConfig?.locations?.join(', ') || '', contacts: `${landingConfig?.contacts?.email || ''}, ${landingConfig?.contacts?.phone || ''}`, features: landingConfig?.features?.join(', ') || '', pricing: landingConfig?.pricingSummary || '' } };
  const response = await axios.post(`${baseUrl}/erp/query`, payload, { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 15000 });
  return response.data;
};

module.exports = { tenantQuery, landingQuery, buildContextData };