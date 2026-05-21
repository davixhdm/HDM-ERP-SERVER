const axios = require('axios');
const AIConfig = require('../models/ai/AIConfig');
const TenantAISettings = require('../models/ai/TenantAISettings');
const Tenant = require('../models/master/Tenant');
const Plan = require('../models/master/Plan');
const AIUsageLog = require('../models/ai/AIUsageLog');
const AIAlert = require('../models/ai/AIAlert');
const config = require('../config/env');
const logger = require('../utils/logger');

const getTenantAIConfig = async (tenantId) => {
  const tenant = await Tenant.findById(tenantId).populate('plan');
  if (!tenant || tenant.status !== 'active') throw new Error('Tenant not active');
  const plan = await Plan.findOne({ name: tenant.plan });
  if (!plan || !plan.modules.aiSparkle) throw new Error('AI not available on your plan');

  const settings = await TenantAISettings.findOne({ tenantId });
  if (!settings || settings.keySource === 'hdm') {
    const global = await AIConfig.findOne();
    return { provider: global.provider, model: global.model, baseUrl: global.baseUrl, apiKey: global.apiKey, moduleScopes: settings?.moduleScopes || [] };
  }
  return {
    provider: settings.provider,
    model: settings.model,
    baseUrl: getBaseUrlForProvider(settings.provider),
    apiKey: settings.apiKey,
    moduleScopes: settings.moduleScopes || []
  };
};

const getBaseUrlForProvider = (provider) => {
  const providers = require('../config/aiProviders');
  const found = providers.find(p => p.key === provider);
  return found ? found.baseUrl : '';
};

const buildContextData = async (tenantId, moduleScopes) => {
  const data = { invoices: [], products: [], customers: [], summary: {} };
  if (moduleScopes.includes('finance')) {
    const Invoice = require('../models/tenant/Invoice');
    const invoices = await Invoice.find({ tenantId, status: { $ne: 'cancelled' } }).limit(20).lean();
    data.invoices = invoices;
    data.summary.totalRevenue = invoices.reduce((sum, inv) => sum + (inv.status === 'paid' ? inv.grandTotal : 0), 0);
  }
  if (moduleScopes.includes('inventory')) {
    const Product = require('../models/tenant/Product');
    data.products = await Product.find({ tenantId, isActive: true }).lean();
  }
  if (moduleScopes.includes('contacts')) {
    const Contact = require('../models/tenant/Contact');
    data.customers = await Contact.find({ tenantId, type: 'customer' }).lean();
  }
  return data;
};

const tenantQuery = async (tenantId, question, tenantInfo) => {
  const { provider, model, baseUrl, apiKey, moduleScopes } = await getTenantAIConfig(tenantId);
  const businessData = await buildContextData(tenantId, moduleScopes);

  const payload = {
    query: question,
    tenant_id: tenantId.toString(),
    context: { source: 'tenant', tenant_info: tenantInfo },
    data: businessData
  };

  const response = await axios.post(`${baseUrl}/erp/query`, payload, {
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
  });

  await AIUsageLog.create({
    tenantId,
    query: question,
    tokensUsed: response.data.data?.tokens_used || 0,
    provider,
    timestamp: new Date()
  });

  return response.data;
};

const landingQuery = async (question, landingConfig) => {
  const global = await AIConfig.findOne();
  const chatbot = global.landingChatbot;
  const payload = {
    query: question,
    tenant_id: 'landing',
    context: {
      source: 'landing',
      payment_methods: landingConfig.paymentMethods?.join(', ') || '',
      locations: landingConfig.locations?.join(', ') || '',
      contacts: `${landingConfig.contacts?.email || ''}, ${landingConfig.contacts?.phone || ''}`,
      features: landingConfig.features?.join(', ') || '',
      pricing: landingConfig.pricingSummary || ''
    }
  };
  const baseUrl = chatbot.provider === 'hdm-ai' ? config.hdmAi.baseUrl : getBaseUrlForProvider(chatbot.provider);
  const apiKey = chatbot.apiKey || (chatbot.provider === 'hdm-ai' ? config.hdmAi.apiKey : '');
  const response = await axios.post(`${baseUrl}/erp/query`, payload, {
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
  });
  return response.data;
};

const runProactiveAlerts = async () => {
  const tenants = await Tenant.find({ status: 'active' }).lean();
  for (const tenant of tenants) {
    try {
      const settings = await TenantAISettings.findOne({ tenantId: tenant._id });
      const plan = await Plan.findOne({ name: tenant.plan });
      if (!plan?.modules.aiSparkle) continue;
      const moduleScopes = settings?.moduleScopes || [];
      const data = await buildAlertData(tenant._id, moduleScopes);
      if (!data.inventory.length && !data.invoices.length && !data.unusual_activity?.length) continue;

      const { provider, model, baseUrl, apiKey } = await getTenantAIConfig(tenant._id);
      const response = await axios.post(`${baseUrl}/erp/alert/analyze`, {
        tenant_id: tenant._id.toString(),
        data
      }, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const alerts = response.data.data?.alerts || [];
      for (const alert of alerts) {
        await AIAlert.create({ tenantId: tenant._id, ...alert });
      }
    } catch (err) {
      logger.error(`Proactive alert failed for tenant ${tenant._id}: ${err.message}`);
    }
  }
};

const buildAlertData = async (tenantId, moduleScopes) => {
  const inventory = [], invoices = [], unusual_activity = [];
  if (moduleScopes.includes('inventory')) {
    const Product = require('../models/tenant/Product');
    const products = await Product.find({ tenantId, isActive: true }).lean();
    products.forEach(p => {
      const status = p.stock <= 0 ? 'critical' : (p.stock <= p.reorderLevel ? 'warning' : 'ok');
      inventory.push({ product: p.name, stock: p.stock ?? 0, reorder_level: p.reorderLevel, status });
    });
  }
  if (moduleScopes.includes('finance')) {
    const Invoice = require('../models/tenant/Invoice');
    const unpaid = await Invoice.find({ tenantId, status: 'unpaid', dueDate: { $lt: new Date() } }).lean();
    unpaid.forEach(inv => {
      invoices.push({ id: inv._id, status: inv.status, due_date: inv.dueDate, days_overdue: Math.floor((Date.now() - inv.dueDate) / (1000 * 60 * 60 * 24)) });
    });
  }
  return { inventory, invoices, unusual_activity };
};

module.exports = { tenantQuery, landingQuery, runProactiveAlerts };