const axios = require('axios');
const AIConfig = require('../models/ai/AIConfig');
const TenantAISettings = require('../models/ai/TenantAISettings');
const Tenant = require('../models/master/Tenant');
const Plan = require('../models/master/Plan');
const AIUsageLog = require('../models/ai/AIUsageLog');
const config = require('../config/env');
const logger = require('../utils/logger');
const sendEmail = require('../utils/sendEmail');

// In-memory cache: 5 minutes
const responseCache = {};

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
  const providers = {
    'hdm-ai': config.hdmAi.baseUrl || 'https://hdm-ai-server.onrender.com/api/v1',
    'openai': 'https://api.openai.com/v1', 'anthropic': 'https://api.anthropic.com/v1',
    'deepseek': 'https://api.deepseek.com/v1', 'gemini': 'https://generativelanguage.googleapis.com/v1beta',
    'mistral': 'https://api.mistral.ai/v1', 'cohere': 'https://api.cohere.ai/v1'
  };
  return providers[provider] || '';
};

const buildContextData = async (tenantId, moduleScopes, question = '') => {
  const msg = (question || '').toLowerCase();
  const tenant = await Tenant.findById(tenantId);
  const currency = tenant?.currency || 'KSh';
  const fmt = (amount) => `${currency} ${(amount || 0).toLocaleString()}`;

 const generalQueries = ['health', 'overview', 'business', 'performance', 'report', 'summary', 'all', 'everything', 'dashboard', 'sync', 'data', 'pull', 'export', 'fetch'];
  const isGeneralQuery = generalQueries.some(q => msg.includes(q));
  const shouldInclude = (keywords) => isGeneralQuery || keywords.some(k => msg.includes(k));

  const data = { summary: { currency } };

  // ==================== FINANCE ====================
  if (moduleScopes.includes('finance')) {
    const Invoice = require('../models/tenant/Invoice');
    const Bill = require('../models/tenant/Bill');
    const Payment = require('../models/tenant/Payment');
    const Account = require('../models/tenant/Account');
    const [invoices, bills, payments, accounts] = await Promise.all([
      Invoice.find({ tenantId }).sort({ createdAt: -1 }).limit(20).lean(),
      Bill.find({ tenantId }).sort({ createdAt: -1 }).limit(20).lean(),
      Payment.find({ tenantId }).sort({ createdAt: -1 }).limit(20).lean(),
      Account.find({ tenantId }).lean()
    ]);
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
    Object.assign(data.summary, { totalRevenue: tr, pendingRevenue: pr, totalExpenses: te, pendingExpenses: pe, netProfit: tr - te, paidInvoices: paidInv.length, unpaidInvoices: unpaidInv.length, paidBills: paidBills.length, unpaidBills: unpaidBills.length });
  }

  // ==================== INVENTORY ====================
  if ((moduleScopes.includes('inventory') || moduleScopes.includes('products')) && shouldInclude(['stock', 'inventory', 'product', 'low', 'reorder'])) {
    const Product = require('../models/tenant/Product');
    const Warehouse = require('../models/tenant/Warehouse');
    const [products, warehouses] = await Promise.all([Product.find({ tenantId, isActive: true }).limit(30).lean(), Warehouse.find({ tenantId }).lean()]);
    data.products = products.map(p => ({ name: p.name, sku: p.sku, stock: p.stock || 0, unit: p.unit, costPrice: p.costPrice, sellingPrice: p.sellingPrice, reorderLevel: p.reorderLevel }));
    data.warehouses = warehouses.map(w => ({ name: w.name, code: w.code }));
    Object.assign(data.summary, { totalProducts: products.length, totalStock: products.reduce((s, p) => s + (p.stock || 0), 0), lowStockItems: products.filter(p => (p.stock || 0) <= (p.reorderLevel || 0)).length, lowStockList: products.filter(p => (p.stock || 0) <= (p.reorderLevel || 0)).map(p => p.name) });
  }

  // ==================== SALES ====================
  if (moduleScopes.includes('sales') && shouldInclude(['sale', 'order', 'revenue', 'customer', 'quotation'])) {
    const SalesOrder = require('../models/tenant/SalesOrder');
    const orders = await SalesOrder.find({ tenantId }).sort({ createdAt: -1 }).limit(10).lean();
    data.salesOrders = orders.map(o => ({ number: o.orderNumber, customer: o.customerName || 'N/A', total: o.grandTotal, status: o.status, date: o.orderDate }));
    Object.assign(data.summary, { totalSalesOrders: orders.length, pendingOrders: orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length });
  }

  // ==================== HR ====================
  if (moduleScopes.includes('hr') && shouldInclude(['employee', 'staff', 'payroll', 'salary'])) {
    const Employee = require('../models/tenant/Employee');
    const employees = await Employee.find({ tenantId, isActive: true }).lean();
    data.employees = employees.map(e => ({ name: `${e.firstName} ${e.lastName}`, department: e.department, position: e.position, salary: e.basicSalary }));
    Object.assign(data.summary, { totalEmployees: employees.length, totalPayroll: employees.reduce((s, e) => s + (e.basicSalary || 0), 0) });
  }

  // ==================== CONTACTS ====================
  if (moduleScopes.includes('contacts') && shouldInclude(['customer', 'supplier', 'contact'])) {
    const Contact = require('../models/tenant/Contact');
    const contacts = await Contact.find({ tenantId }).lean();
    data.customers = contacts.filter(c => c.type === 'customer').map(c => ({ name: c.companyName, email: c.email, phone: c.phone }));
    data.suppliers = contacts.filter(c => c.type === 'supplier').map(c => ({ name: c.companyName, email: c.email, phone: c.phone }));
    Object.assign(data.summary, { totalCustomers: data.customers.length, totalSuppliers: data.suppliers.length });
  }

  // ==================== SUPPLY CHAIN ====================
  if (moduleScopes.includes('supplyChain') && shouldInclude(['purchase', 'supplier', 'po', 'procurement'])) {
    const PurchaseOrder = require('../models/tenant/PurchaseOrder');
    const pos = await PurchaseOrder.find({ tenantId }).sort({ createdAt: -1 }).limit(10).lean();
    data.purchaseOrders = pos.map(po => ({ number: po.orderNumber, supplier: po.supplierName || 'N/A', total: po.grandTotal, status: po.status, date: po.orderDate }));
    Object.assign(data.summary, { totalPurchaseOrders: pos.length });
  }

  // ==================== MANUFACTURING ====================
  if (moduleScopes.includes('manufacturing') && shouldInclude(['manufacturing', 'work order', 'production'])) {
    const WorkOrder = require('../models/tenant/WorkOrder');
    const workOrders = await WorkOrder.find({ tenantId }).sort({ createdAt: -1 }).limit(10).lean();
    data.workOrders = workOrders.map(wo => ({ number: wo.orderNumber, product: wo.product?.name || 'N/A', quantity: wo.quantity, status: wo.status, output: wo.outputQuantity, qcStatus: wo.qualityStatus }));
    Object.assign(data.summary, { totalWorkOrders: workOrders.length, completedWorkOrders: workOrders.filter(wo => wo.status === 'completed').length });
  }

  // ==================== CRM ====================
  if (moduleScopes.includes('crm') && shouldInclude(['lead', 'pipeline', 'crm', 'deal', 'opportunity'])) {
    const Lead = require('../models/tenant/Lead');
    const leads = await Lead.find({ tenantId }).sort({ createdAt: -1 }).limit(20).lean();
    const stageCounts = { lead: 0, qualified: 0, proposal: 0, negotiation: 0, won: 0, lost: 0 };
    leads.forEach(l => { stageCounts[l.stage] = (stageCounts[l.stage] || 0) + 1; });
    data.leads = leads.map(l => ({ name: `${l.firstName} ${l.lastName}`, company: l.company, stage: l.stage, value: l.value, source: l.source }));
    Object.assign(data.summary, {
      totalLeads: leads.length,
      pipelineValue: leads.reduce((s, l) => s + (l.value || 0), 0),
      wonLeads: stageCounts.won,
      lostLeads: stageCounts.lost,
      conversionRate: leads.length > 0 ? Math.round((stageCounts.won / leads.length) * 100) : 0,
      leadStages: stageCounts
    });
  }

  // ==================== PROJECTS ====================
  if (moduleScopes.includes('projects') && shouldInclude(['project', 'task', 'deadline', 'milestone'])) {
    const Project = require('../models/tenant/Project');
    const Task = require('../models/tenant/Task');
    const [projects, tasks] = await Promise.all([
      Project.find({ tenantId }).sort({ createdAt: -1 }).limit(10).lean(),
      Task.find({ tenantId }).sort({ createdAt: -1 }).limit(50).lean()
    ]);
    data.projects = projects.map(p => ({ name: p.name, status: p.status, priority: p.priority, budget: p.budget }));
    const doneTasks = tasks.filter(t => t.status === 'done').length;
    Object.assign(data.summary, {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      totalTasks: tasks.length,
      completedTasks: doneTasks,
      pendingTasks: tasks.filter(t => t.status !== 'done').length,
      taskCompletionRate: tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0
    });
  }

  // ==================== ASSETS ====================
  if (moduleScopes.includes('assets') && shouldInclude(['asset', 'equipment', 'maintenance', 'depreciation'])) {
    const Asset = require('../models/tenant/Asset');
    const Maintenance = require('../models/tenant/Maintenance');
    const [assets, maintenances] = await Promise.all([
      Asset.find({ tenantId }).sort({ createdAt: -1 }).limit(20).lean(),
      Maintenance.find({ tenantId, status: { $in: ['scheduled', 'in_progress'] } }).lean()
    ]);
    data.assets = assets.map(a => ({ name: a.name, code: a.code, category: a.category, status: a.status, value: a.currentValue }));
    const categoryCounts = {};
    assets.forEach(a => { categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1; });
    Object.assign(data.summary, {
      totalAssets: assets.length,
      totalAssetValue: assets.reduce((s, a) => s + (a.currentValue || 0), 0),
      totalPurchaseCost: assets.reduce((s, a) => s + (a.purchaseCost || 0), 0),
      assetsInMaintenance: assets.filter(a => a.status === 'maintenance').length,
      retiredAssets: assets.filter(a => a.status === 'retired').length,
      pendingMaintenance: maintenances.length,
      assetCategories: categoryCounts
    });
  }

  return data;
};

const tenantQuery = async (tenantId, question, tenantInfo) => {
  const cacheKey = `${tenantId}:${question}`;
  if (responseCache[cacheKey] && (Date.now() - responseCache[cacheKey].time) < 300000) {
    logger.info(`Cache hit for tenant=${tenantId}`);
    return responseCache[cacheKey].data;
  }

  const { provider, model, baseUrl, apiKey, moduleScopes } = await getTenantAIConfig(tenantId);
  const businessData = await buildContextData(tenantId, moduleScopes, question);
  const tenant = await Tenant.findById(tenantId);
  const currency = tenant?.currency || 'KSh';

  const payload = {
    query: question, tenant_id: tenantId.toString(),
    context: { source: 'tenant', tenant_info: { name: tenantInfo?.companyName || 'Tenant', plan: tenantInfo?.plan || 'standard', business_type: tenantInfo?.businessType || 'General', currency } },
    data: businessData
  };

  try {
    const response = await axios.post(`${baseUrl}/erp/query`, payload, {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 30000
    });
    await AIUsageLog.create({ tenantId, query: question, tokensUsed: response.data?.data?.tokens_used || 0, provider, timestamp: new Date() });
    responseCache[cacheKey] = { data: response.data, time: Date.now() };
    return response.data;
  } catch (err) {
    logger.error(`AI Call Failed: ${err.message}`);
    throw err;
  }
};

const landingQuery = async (question, landingConfig) => {
  const aiConfig = await AIConfig.findOne();
  const chatbot = aiConfig?.landingChatbot || {};

  if (!aiConfig?.features?.landingPageAI || !chatbot.enabled) {
    throw new Error('Chatbot disabled');
  }

  const baseUrl = chatbot.baseUrl || aiConfig?.baseUrl || config.hdmAi.baseUrl || 'https://hdm-ai-server.onrender.com/api/v1';
  const apiKey = chatbot.apiKey || aiConfig?.apiKey || config.hdmAi.apiKey;

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
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    timeout: 15000
  });

  return response.data;
};

// ==================== PROACTIVE ALERTS ====================
const runProactiveAlerts = async () => {
  try {
    const aiConfig = await AIConfig.findOne();
    if (!aiConfig) {
      logger.info('Proactive alerts: No AI config found, skipping');
      return;
    }
    if (!aiConfig.features?.proactiveAlerts) {
      logger.info('Proactive alerts: Disabled by super admin');
      return;
    }

    const alertInterval = aiConfig.features?.proactiveAlertIntervalHours || 6;
    const batchSize = aiConfig.features?.proactiveAlertBatchSize || 10;
    logger.info(`Proactive alerts: Running (interval=${alertInterval}h, batch=${batchSize})`);

    const activeTenants = await Tenant.find({ status: 'active' }).limit(batchSize);
    let alerted = 0;
    let skipped = 0;

    for (const tenant of activeTenants) {
      try {
        const plan = await Plan.findOne({ name: tenant.plan });
        if (!plan || !plan.modules?.aiSparkle) { skipped++; continue; }

        const settings = await TenantAISettings.findOne({ tenantId: tenant._id });
        const moduleScopes = settings?.moduleScopes || [];
        if (moduleScopes.length === 0) { skipped++; continue; }

        const lastAlert = await AIUsageLog.findOne({ tenantId: tenant._id, query: '__proactive_alert__' }).sort({ timestamp: -1 });
        if (lastAlert) {
          const hoursSince = (Date.now() - lastAlert.timestamp.getTime()) / (1000 * 60 * 60);
          if (hoursSince < alertInterval) { skipped++; continue; }
        }

        const data = await buildContextData(tenant._id, moduleScopes, 'overview');
        const alerts = [];

        // Low stock
        if (data.summary?.lowStockItems > 0 && data.summary?.lowStockList?.length > 0) {
          const items = data.summary.lowStockList.slice(0, 5).join(', ');
          alerts.push({ icon: '📦', title: 'Low Stock Alert', detail: `${data.summary.lowStockItems} item(s): ${items}${data.summary.lowStockList.length > 5 ? ` and ${data.summary.lowStockList.length - 5} more` : ''}`, severity: 'warning' });
        }

        // Unpaid invoices
        if (data.summary?.unpaidInvoices > 0) {
          alerts.push({ icon: '📋', title: 'Unpaid Invoices', detail: `${data.summary.unpaidInvoices} unpaid invoice(s) totaling ${data.summary.currency} ${(data.summary.pendingRevenue || 0).toLocaleString()}`, severity: 'info' });
        }

        // Unpaid bills
        if (data.summary?.unpaidBills > 0) {
          alerts.push({ icon: '💰', title: 'Unpaid Bills', detail: `${data.summary.unpaidBills} unpaid bill(s) totaling ${data.summary.currency} ${(data.summary.pendingExpenses || 0).toLocaleString()}`, severity: 'info' });
        }

        // Negative profit
        if (data.summary?.netProfit < 0) {
          alerts.push({ icon: '📉', title: 'Negative Net Profit', detail: `Expenses exceed revenue by ${data.summary.currency} ${Math.abs(data.summary.netProfit).toLocaleString()}`, severity: 'danger' });
        }

        // Pending sales orders
        if (data.summary?.pendingOrders > 0) {
          alerts.push({ icon: '📝', title: 'Pending Sales Orders', detail: `${data.summary.pendingOrders} order(s) awaiting fulfillment`, severity: 'info' });
        }

        // Pending maintenance
        if (data.summary?.pendingMaintenance > 0) {
          alerts.push({ icon: '🔧', title: 'Pending Maintenance', detail: `${data.summary.pendingMaintenance} maintenance record(s) need attention`, severity: 'warning' });
        }

        // Overdue tasks
        if (data.summary?.pendingTasks > 0 && data.summary?.totalTasks > 0) {
          alerts.push({ icon: '📐', title: 'Pending Tasks', detail: `${data.summary.pendingTasks} task(s) still in progress or todo`, severity: 'info' });
        }

        // Low conversion rate
        if (data.summary?.totalLeads > 5 && data.summary?.conversionRate < 20) {
          alerts.push({ icon: '🎯', title: 'Low Lead Conversion', detail: `Only ${data.summary.conversionRate}% of ${data.summary.totalLeads} leads converted`, severity: 'warning' });
        }

        // Send email
        if (alerts.length > 0 && tenant.contactEmail) {
          const alertCards = alerts.map(a => `
            <div style="margin:10px 0;padding:12px;border-left:4px solid ${a.severity === 'danger' ? '#EF4444' : a.severity === 'warning' ? '#F59E0B' : '#3B82F6'};background:#f9fafb;border-radius:4px;">
              <p style="margin:0;font-size:14px;"><strong>${a.icon} ${a.title}</strong></p>
              <p style="margin:4px 0 0 0;font-size:13px;color:#4b5563;">${a.detail}</p>
            </div>
          `).join('');

          await sendEmail({
            to: tenant.contactEmail,
            toName: tenant.companyName,
            subject: `🔔 HDM ERP — ${alerts.length} Alert(s) for ${tenant.companyName}`,
            htmlContent: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px;border:1px solid #e5e7eb;border-radius:8px;">
                <div style="background:#10B981;padding:16px;text-align:center;border-radius:8px 8px 0 0;margin:-20px -20px 20px -20px;">
                  <h2 style="color:#fff;margin:0;font-size:18px;">Proactive Business Alerts</h2>
                </div>
                <p style="font-size:14px;">Hello <strong>${tenant.companyName}</strong>,</p>
                <p style="font-size:13px;color:#6b7280;">Here's what needs your attention:</p>
                ${alertCards}
                <div style="text-align:center;margin-top:20px;">
                  <a href="https://hdmerp.pxxl.click/login" style="display:inline-block;background:#10B981;color:#fff;padding:10px 24px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;">View Dashboard</a>
                </div>
                <p style="color:#9ca3af;font-size:11px;margin-top:20px;text-align:center;">
                  You're receiving this because proactive alerts are enabled. Manage in <strong>Settings → AI</strong>.<br>
                  To unsubscribe, contact your administrator.
                </p>
              </div>`
          });

          await AIUsageLog.create({
            tenantId: tenant._id,
            query: '__proactive_alert__',
            tokensUsed: 0,
            provider: 'system',
            timestamp: new Date()
          });

          logger.info(`Proactive alert sent to ${tenant.companyName}: ${alerts.length} issue(s)`);
          alerted++;
        }
      } catch (tenantErr) {
        logger.warn(`Proactive alert skipped for tenant ${tenant._id}: ${tenantErr.message}`);
        skipped++;
      }
    }

    logger.info(`Proactive alerts completed: ${alerted} sent, ${skipped} skipped, ${activeTenants.length} checked`);
  } catch (err) {
    logger.error('Proactive alerts failed:', err.message);
    throw err;
  }
};

module.exports = { tenantQuery, landingQuery, buildContextData, runProactiveAlerts };