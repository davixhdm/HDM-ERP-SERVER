module.exports = {
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    COMPANY_ADMIN: 'company_admin',
    ACCOUNTANT: 'accountant',
    HR_MANAGER: 'hr_manager',
    SALES_MANAGER: 'sales_manager',
    INVENTORY_MANAGER: 'inventory_manager',
    STAFF: 'staff'
  },
  PLAN_NAMES: {
    FREE_TRIAL: 'free_trial',
    STANDARD: 'standard',
    PRO: 'pro',
    ENTERPRISE: 'enterprise'
  },
  TENANT_STATUS: {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    DELETED: 'deleted',
    PENDING: 'pending'
  },
  INVOICE_STATUS: {
    DRAFT: 'draft',
    SENT: 'sent',
    PAID: 'paid',
    CANCELLED: 'cancelled'
  },
  BILL_STATUS: {
    DRAFT: 'draft',
    OPEN: 'open',
    PAID: 'paid',
    VOID: 'void'
  },
  ORDER_STATUS: {
    DRAFT: 'draft',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    INVOICED: 'invoiced',
    PAID: 'paid',
    CANCELLED: 'cancelled'
  },
  STOCK_MOVEMENT_TYPES: [
    'receipt',
    'issue',
    'transfer_in',
    'transfer_out',
    'adjustment',
    'return',
    'production',
    'consumption'
  ],
  LEAVE_TYPES: ['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'other'],
  PAYMENT_METHODS: [
    'stripe',
    'mpesa_stk',
    'mpesa_send_money',
    'mpesa_paybill',
    'mpesa_till',
    'paypal',
    'bank_transfer',
    'cash'
  ],
  AI_KEY_SOURCES: ['hdm', 'own'],
  AI_PROVIDERS: ['hdm-ai', 'openai', 'anthropic', 'deepseek', 'gemini', 'mistral', 'cohere'],
  CURRENCIES: ['KSh', 'USD', 'EUR', 'GBP']
};