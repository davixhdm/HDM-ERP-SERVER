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
    return {
      provider: settings.provider,
      model: settings.model,
      baseUrl: getBaseUrlForProvider(settings.provider),
      apiKey: settings.apiKey,
      moduleScopes: settings.moduleScopes || []
    };
  }

  return {
    provider: aiConfig.provider,
    model: aiConfig.model,
    baseUrl: aiConfig.baseUrl || config.hdmAi.baseUrl,
    apiKey: aiConfig.apiKey || config.hdmAi.apiKey,
    moduleScopes: settings?.moduleScopes || []
  };
};

const getBaseUrlForProvider = (provider) => {
  const providers = {
    'hdm-ai': config.hdmAi.baseUrl || 'https://hdmai-server.onrender.com/api/v1',
    'openai': 'https://api.openai.com/v1',
    'anthropic': 'https://api.anthropic.com/v1',
    'deepseek': 'https://api.deepseek.com/v1',
    'gemini': 'https://generativelanguage.googleapis.com/v1beta',
    'mistral': 'https://api.mistral.ai/v1',
    'cohere': 'https://api.cohere.ai/v1'
  };
  return providers[provider] || '';
};

const buildContextData = async (tenantId, moduleScopes) => {
  const data = {
    invoices: [],
    bills: [],
    payments: [],
    products: [],
    customers: [],
    suppliers: [],
    employees: [],
    salesOrders: [],
    purchaseOrders: [],
    workOrders: [],
    summary: {}
  };

  // Finance
  if (moduleScopes.includes('finance')) {
    const Invoice = require('../models/tenant/Invoice');
    const Bill = require('../models/tenant/Bill');
    const Payment = require('../models/tenant/Payment');
    const Account = require('../models/tenant/Account');

    const [invoices, bills, payments, accounts] = await Promise.all([
      Invoice.find({ tenantId }).sort({ createdAt: -1 }).limit(50).lean(),
      Bill.find({ tenantId }).sort({ createdAt: -1 }).limit(50).lean(),
      Payment.find({ tenantId }).sort({ createdAt: -1 }).limit(50).lean(),
      Account.find({ tenantId }).lean()
    ]);

    data.invoices = invoices.map(i => ({
      number: i.invoiceNumber,
      customer: i.customerName || 'N/A',
      amount: i.grandTotal,
      status: i.status,
      date: i.invoiceDate,
      dueDate: i.dueDate
    }));

    data.bills = bills.map(b => ({
      number: b.billNumber,
      supplier: b.supplierName || 'N/A',
      amount: b.grandTotal,
      status: b.status,
      date: b.billDate,
      dueDate: b.dueDate
    }));

    data.payments = payments.map(p => ({
      type: p.type,
      payerPayee: p.payerPayee,
      amount: p.amount,
      method: p.paymentMethod,
      date: p.date
    }));

    // Summary
    const paidInvoices = invoices.filter(i => i.status === 'paid');
    const unpaidInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'draft');
    const paidBills = bills.filter(b => b.status === 'paid');
    const unpaidBills = bills.filter(b => b.status === 'open' || b.status === 'draft');
    const incomePayments = payments.filter(p => p.type === 'income');
    const expensePayments = payments.filter(p => p.type === 'expense');

    data.summary.totalRevenue = paidInvoices.reduce((s, i) => s + (i.grandTotal || 0), 0) + incomePayments.reduce((s, p) => s + (p.amount || 0), 0);
    data.summary.pendingRevenue = unpaidInvoices.reduce((s, i) => s + (i.grandTotal || 0), 0);
    data.summary.totalExpenses = paidBills.reduce((s, b) => s + (b.grandTotal || 0), 0) + expensePayments.reduce((s, p) => s + (p.amount || 0), 0);
    data.summary.pendingExpenses = unpaidBills.reduce((s, b) => s + (b.grandTotal || 0), 0);
    data.summary.paidInvoices = paidInvoices.length;
    data.summary.unpaidInvoices = unpaidInvoices.length;
    data.summary.paidBills = paidBills.length;
    data.summary.unpaidBills = unpaidBills.length;
    data.summary.totalAccounts = accounts.length;
    data.summary.accounts = accounts.map(a => ({ name: a.name, type: a.type, balance: a.currentBalance }));
  }

  // Inventory & Products
  if (moduleScopes.includes('inventory') || moduleScopes.includes('products')) {
    const Product = require('../models/tenant/Product');
    const Warehouse = require('../models/tenant/Warehouse');
    const [products, warehouses] = await Promise.all([
      Product.find({ tenantId, isActive: true }).lean(),
      Warehouse.find({ tenantId }).lean()
    ]);

    data.products = products.map(p => ({
      name: p.name,
      sku: p.sku,
      category: p.category,
      stock: p.stock || 0,
      unit: p.unit,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      reorderLevel: p.reorderLevel
    }));

    data.summary.totalProducts = products.length;
    data.summary.totalStock = products.reduce((s, p) => s + (p.stock || 0), 0);
    data.summary.lowStockItems = products.filter(p => (p.stock || 0) <= (p.reorderLevel || 0)).length;
    data.summary.lowStockList = products.filter(p => (p.stock || 0) <= (p.reorderLevel || 0)).map(p => p.name);
    data.summary.totalWarehouses = warehouses.length;
  }

  // Sales
  if (moduleScopes.includes('sales')) {
    const SalesOrder = require('../models/tenant/SalesOrder');
    const orders = await SalesOrder.find({ tenantId }).sort({ createdAt: -1 }).limit(20).lean();
    data.salesOrders = orders.map(o => ({
      number: o.orderNumber,
      customer: o.customerName || 'N/A',
      total: o.grandTotal,
      status: o.status,
      date: o.orderDate
    }));

    data.summary.totalSalesOrders = orders.length;
    data.summary.pendingOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
    data.summary.completedOrders = orders.filter(o => o.status === 'delivered').length;
  }

  // HR
  if (moduleScopes.includes('hr')) {
    const Employee = require('../models/tenant/Employee');
    const employees = await Employee.find({ tenantId, isActive: true }).lean();
    data.employees = employees.map(e => ({
      name: `${e.firstName} ${e.lastName}`,
      department: e.department,
      position: e.position,
      type: e.employmentType,
      salary: e.basicSalary
    }));

    data.summary.totalEmployees = employees.length;
    data.summary.totalPayroll = employees.reduce((s, e) => s + (e.basicSalary || 0), 0);
    data.summary.departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
  }

  // Contacts
  if (moduleScopes.includes('contacts')) {
    const Contact = require('../models/tenant/Contact');
    const contacts = await Contact.find({ tenantId }).lean();
    data.customers = contacts.filter(c => c.type === 'customer').map(c => ({ name: c.companyName, email: c.email, phone: c.phone }));
    data.suppliers = contacts.filter(c => c.type === 'supplier').map(c => ({ name: c.companyName, email: c.email, phone: c.phone }));
    data.summary.totalCustomers = data.customers.length;
    data.summary.totalSuppliers = data.suppliers.length;
  }

  // Supply Chain
  if (moduleScopes.includes('supplyChain')) {
    const PurchaseOrder = require('../models/tenant/PurchaseOrder');
    const pos = await PurchaseOrder.find({ tenantId }).sort({ createdAt: -1 }).limit(20).lean();
    data.purchaseOrders = pos.map(po => ({
      number: po.orderNumber,
      supplier: po.supplierName || 'N/A',
      total: po.grandTotal,
      status: po.status,
      date: po.orderDate
    }));
    data.summary.totalPurchaseOrders = pos.length;
    data.summary.pendingPOs = pos.filter(po => po.status !== 'delivered' && po.status !== 'cancelled').length;
  }

  // Manufacturing
  if (moduleScopes.includes('manufacturing')) {
    const WorkOrder = require('../models/tenant/WorkOrder');
    const workOrders = await WorkOrder.find({ tenantId }).sort({ createdAt: -1 }).limit(20).lean();
    data.workOrders = workOrders.map(wo => ({
      number: wo.orderNumber,
      product: wo.product?.name || 'N/A',
      quantity: wo.quantity,
      status: wo.status,
      output: wo.outputQuantity,
      scrap: wo.scrapQuantity,
      qcStatus: wo.qualityStatus
    }));
    data.summary.totalWorkOrders = workOrders.length;
    data.summary.completedWorkOrders = workOrders.filter(wo => wo.status === 'completed').length;
    data.summary.pendingWorkOrders = workOrders.filter(wo => wo.status !== 'completed' && wo.status !== 'cancelled').length;
  }

  return data;
};

const tenantQuery = async (tenantId, question, tenantInfo) => {
  const { provider, model, baseUrl, apiKey, moduleScopes } = await getTenantAIConfig(tenantId);
  const businessData = await buildContextData(tenantId, moduleScopes);

  const payload = {
    query: question,
    tenant_id: tenantId.toString(),
    context: {
      source: 'tenant',
      tenant_info: {
        name: tenantInfo?.companyName || 'Tenant',
        plan: tenantInfo?.plan || 'standard',
        business_type: tenantInfo?.businessType || 'General'
      }
    },
    data: businessData
  };

  const response = await axios.post(`${baseUrl}/erp/query`, payload, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 30000
  });

  await AIUsageLog.create({
    tenantId,
    query: question,
    tokensUsed: response.data?.data?.tokens_used || 0,
    provider,
    timestamp: new Date()
  });

  return response.data;
};

const landingQuery = async (question, landingConfig) => {
  const aiConfig = await AIConfig.findOne();
  const chatbot = aiConfig?.landingChatbot || {};

  if (!aiConfig?.features?.landingPageAI || !chatbot.enabled) {
    throw new Error('Chatbot disabled');
  }

  const baseUrl = chatbot.provider === 'hdm-ai'
    ? config.hdmAi.baseUrl
    : getBaseUrlForProvider(chatbot.provider);

  const apiKey = chatbot.apiKey || config.hdmAi.apiKey;

  const payload = {
    query: question,
    tenant_id: 'landing',
    context: {
      source: 'landing',
      payment_methods: landingConfig?.paymentMethods?.join(', ') || '',
      locations: landingConfig?.locations?.join(', ') || '',
      contacts: `${landingConfig?.contacts?.email || ''}, ${landingConfig?.contacts?.phone || ''}`,
      features: landingConfig?.features?.join(', ') || '',
      pricing: landingConfig?.pricingSummary || ''
    }
  };

  const response = await axios.post(`${baseUrl}/erp/query`, payload, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 15000
  });

  return response.data;
};

module.exports = { tenantQuery, landingQuery, buildContextData };