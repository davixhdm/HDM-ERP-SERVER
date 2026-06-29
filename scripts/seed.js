require('../dnsSet');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const readline = require('readline');
const Admin = require('../models/master/Admin');
const Plan = require('../models/master/Plan');
const SystemSettings = require('../models/master/SystemSettings');
const AIConfig = require('../models/ai/AIConfig');
const LandingPageConfig = require('../models/public/LandingPageConfig');
const LegalContent = require('../models/public/LegalContent');
const BackupSettings = require('../models/master/BackupSettings');

const MONGODB_URI = process.env.MONGODB_URI;

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (p) => new Promise(r => rl.question(p, r));

const green = '\x1b[32m'; const red = '\x1b[31m'; const yellow = '\x1b[33m';
const cyan = '\x1b[36m'; const reset = '\x1b[0m'; const bold = '\x1b[1m';
const log = (m) => console.log(`${green}${m}${reset}`);
const warn = (m) => console.log(`${yellow}${m}${reset}`);
const err = (m) => console.log(`${red}${m}${reset}`);
const header = (m) => console.log(`\n${bold}${cyan}═══ ${m} ═══${reset}\n`);

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const defaultAdmin = {
  email: process.env.ADMIN_EMAIL || 'davismcintyre5@gmail.com',
  password: process.env.ADMIN_PASSWORD || 'Hdm@2002',
  name: 'Super Admin',
  role: 'super_admin'
};

const defaultPlans = [
  {
    name: 'free_trial', displayName: 'Free Trial', enabled: true,
    trialDays: 14, sortOrder: 1,
    pricing: { monthly: 0, yearly: 0, permanent: 0, stripePriceId: '' },
    modules: {
      finance: true, hr: true, sales: true, inventory: true,
      supplyChain: true, orders: true, manufacturing: false,
      contacts: true, products: true, reports: true, settings: true,
      dashboard: true, landingPage: true,
      aiSparkle: false, aiFileUpload: false, outwardApiKeys: false,
      communications: true,
      crm: false, projects: false, assets: false
    },
    limits: { maxUsers: 3, maxStorageGB: 0.5, maxCustomReports: 3, aiWrite: false, aiOutwardKeys: 0, whiteLabel: false, multiCompany: false, dedicatedDatabase: false, supportLevel: 'community' }
  },
  {
    name: 'standard', displayName: 'Standard', enabled: true,
    trialDays: 0, sortOrder: 2,
    pricing: { monthly: 4, yearly: 44, permanent: 84, stripePriceId: '' },
    modules: {
      finance: true, hr: true, sales: true, inventory: true,
      supplyChain: true, orders: true, manufacturing: false,
      contacts: true, products: true, reports: true, settings: true,
      dashboard: true, landingPage: true,
      aiSparkle: false, aiFileUpload: false, outwardApiKeys: false,
      communications: true,
      crm: true, projects: false, assets: false
    },
    limits: { maxUsers: 5, maxStorageGB: 1, maxCustomReports: 5, aiWrite: false, aiOutwardKeys: 0, whiteLabel: false, multiCompany: false, dedicatedDatabase: false, supportLevel: 'email_chat' }
  },
  {
    name: 'pro', displayName: 'Pro', enabled: true,
    trialDays: 0, sortOrder: 3,
    pricing: { monthly: 6, yearly: 69, permanent: 154, stripePriceId: '' },
    modules: {
      finance: true, hr: true, sales: true, inventory: true,
      supplyChain: true, orders: true, manufacturing: true,
      contacts: true, products: true, reports: true, settings: true,
      dashboard: true, landingPage: true,
      aiSparkle: true, aiFileUpload: true, outwardApiKeys: true,
      communications: true,
      crm: true, projects: true, assets: false
    },
    limits: { maxUsers: 20, maxStorageGB: 5, maxCustomReports: 20, aiWrite: true, aiOutwardKeys: 1, whiteLabel: false, multiCompany: false, dedicatedDatabase: false, supportLevel: 'email_chat' }
  },
  {
    name: 'enterprise', displayName: 'Enterprise', enabled: true,
    trialDays: 0, sortOrder: 4,
    pricing: { monthly: 10, yearly: 97, permanent: 211, stripePriceId: '' },
    modules: {
      finance: true, hr: true, sales: true, inventory: true,
      supplyChain: true, orders: true, manufacturing: true,
      contacts: true, products: true, reports: true, settings: true,
      dashboard: true, landingPage: true,
      aiSparkle: true, aiFileUpload: true, outwardApiKeys: true,
      communications: true,
      crm: true, projects: true, assets: true
    },
    limits: { maxUsers: 999, maxStorageGB: 100, maxCustomReports: 999, aiWrite: true, aiOutwardKeys: 999, whiteLabel: true, multiCompany: true, dedicatedDatabase: true, supportLevel: 'dedicated' }
  }
];

const defaultSettings = {
  general: {
    systemName: 'HDM ERP',
    tagline: 'Smart Business Management Powered by AI',
    contactEmail: 'support@hdmerp.com',
    contactPhone: '+254 768 784 909',
    address: 'Nairobi, Kenya',
    timezone: 'Africa/Nairobi',
    dateFormat: 'DD/MM/YYYY',
    defaultLanguage: 'en',
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.'
  },
  branding: { logoNavbar: '', logoFavicon: '', primaryColor: '#10B981', secondaryColor: '#1E3A5F' },
  landingPage: {
    heroHeadline: 'Smart Business Management',
    heroSubtext: 'Manage your entire business from one platform — powered by AI.',
    moduleTags: ['Finance', 'HR', 'Sales', 'Inventory', 'Supply Chain', 'Manufacturing', 'AI Powered', 'Reports'],
    launchButtonLabel: 'Launch App',
    registerButtonLabel: 'Get Started Free',
    aboutText: 'HDM ERP is a powerful, AI-driven enterprise resource planning platform built for businesses of all sizes. Manage finances, HR, sales, inventory, supply chain, and manufacturing from one unified dashboard. With built-in AI assistance, multi-currency support, and real-time analytics, HDM ERP helps you make smarter business decisions faster.',
    footer: { copyright: '© 2026 HDM ERP. All rights reserved.', privacyPolicyUrl: '', termsOfServiceUrl: '', licenseUrl: '', supportEmail: 'support@hdmerp.com', supportPhone: '+254 768 784 909' }
  },
  payments: {
    stripe: { enabled: false },
    mpesa: {
      enabled: true,
      stkPush: true,
      sendMoney: { enabled: true, phoneNumber: '0768784909' },
      paybill: { enabled: false, businessNumber: '', accountName: '' },
      till: { enabled: false, tillNumber: '', businessName: '' }
    },
    paypal: { enabled: false },
    currency: 'KSh',
    requireProof: false
  },
  uploads: { maxFileSizeMB: 10, allowedTypes: ['image/png', 'image/jpeg', 'application/pdf'] },
  downloads: { desktop: { enabled: false, url: '', label: '' }, mobile: { enabled: false, url: '', label: '' } }
};

const defaultAIConfig = {
  provider: 'hdm-ai', model: 'hdm-default',
  baseUrl: 'https://hdmai-server.onrender.com/api/v1',
  apiKey: process.env.HDM_AI_API_KEY || 'hdm_erp_f10c05018a390678378c40dbb110f6c6e09963eeebc111f6',
  features: { landingPageAI: true, clientAI: true, proactiveAlerts: true, fileUpload: true, outwardKeyGen: true, maxFileSizeMB: 5 },
  landingChatbot: {
    enabled: true, provider: 'hdm-ai', model: 'hdm-default',
    apiKey: process.env.HDM_AI_API_KEY || 'hdm_erp_f10c05018a390678378c40dbb110f6c6e09963eeebc111f6',
    botName: 'HDM Assistant', welcomeMessage: 'Hello! How can I help you today?', color: '#10B981', position: 'bottom-right'
  }
};

const defaultLandingConfig = {
  heroHeadline: 'Smart Business Management',
  heroSubtext: 'Manage your entire business from one platform — powered by AI.',
  moduleTags: ['Finance', 'HR', 'Sales', 'Inventory', 'Supply Chain', 'Manufacturing', 'AI Powered', 'Reports'],
  launchButtonLabel: 'Launch App', registerButtonLabel: 'Get Started Free',
  aboutText: 'HDM ERP is a powerful, AI-driven enterprise resource planning platform.',
  footer: { copyright: '© 2026 HDM ERP. All rights reserved.', privacyPolicyUrl: '', termsOfServiceUrl: '', licenseUrl: '', supportEmail: 'support@hdmerp.com', supportPhone: '+254 768 784 909' },
  paymentMethods: ['M-Pesa', 'Stripe', 'Bank Transfer'],
  locations: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'],
  contacts: { email: 'support@hdmerp.com', phone: '+254 768 784 909' },
  features: ['Invoicing', 'Inventory', 'Payroll', 'CRM', 'Analytics', 'Multi-tenant', 'AI Assistant'],
  pricingSummary: 'Free trial 14 days, Standard KSh 1,540/mo, Pro KSh 3,845/mo, Enterprise KSh 7,695/mo'
};

const defaultLegalDocs = [
  {
    type: 'privacy_policy', title: 'Privacy Policy',
    content: `1. Introduction
This Privacy Policy describes how HDM ERP collects, uses, and protects your personal information.

2. Information We Collect
We collect information you provide during registration, including company name, email address, phone number, and payment details.

3. How We Use Information
Your information is used to provide and improve our services, process payments, communicate with you, and ensure platform security.

4. Data Storage
All data is stored on secure servers with encryption at rest and in transit. We use industry-standard security practices.

5. Data Sharing
We do not sell, trade, or share your personal information with third parties except as required by law or with your explicit consent.

6. Cookies
We use essential cookies for authentication and session management. Analytics cookies help us improve the platform.

7. Data Retention
We retain your data for as long as your account is active. Upon deletion, data is permanently removed within 30 days.

8. Your Rights
You have the right to access, correct, or delete your personal data. Contact support to exercise these rights.

9. Policy Changes
We may update this policy from time to time. Significant changes will be communicated via email.

10. Contact
For privacy-related inquiries, contact us at support@hdmerp.com or +254 768 784 909.`
  },
  {
    type: 'terms_of_service', title: 'Terms of Service',
    content: `1. Acceptance of Terms
By accessing and using HDM ERP, you agree to be bound by these Terms of Service.

2. Account Registration
You must provide accurate information during registration. You are responsible for maintaining account confidentiality.

3. Subscription & Payments
Plans are billed monthly, yearly, or as a one-time payment. Prices are displayed in your selected currency.

4. Free Trial
The 14-day free trial provides access to core features. No payment is required during the trial period.

5. Acceptable Use
You may not use the platform for illegal activities, spamming, or any purpose that violates applicable laws.

6. Intellectual Property
All software, designs, and content are the property of HDM ERP. You may not copy or redistribute them.

7. Limitation of Liability
HDM ERP is provided "as is." We are not liable for damages arising from use or inability to use the platform.

8. Termination
We reserve the right to suspend or terminate accounts that violate these terms without prior notice.

9. Changes to Terms
We may modify these terms. Continued use after changes constitutes acceptance of the new terms.

10. Governing Law
These terms are governed by the laws of Kenya. Disputes shall be resolved through arbitration in Nairobi.`
  },
  {
    type: 'license_agreement', title: 'License Agreement',
    content: `1. Grant of License
This agreement grants you a non-exclusive, non-transferable right to use HDM ERP software.

2. License Scope
The license covers the number of users specified in your plan. Additional users require an upgrade.

3. Restrictions
You may not reverse engineer, decompile, or modify the software. Sub-licensing is prohibited.

4. Ownership
All rights, title, and interest in the software remain with HDM ERP. This is a license, not a sale.

5. Updates
We provide updates and patches during the license period. Major version upgrades may require plan renewal.

6. Support
Support level depends on your plan: Community (Free Trial), Email/Chat (Standard/Pro), Dedicated (Enterprise).

7. Warranty
The software is provided without warranty of any kind, express or implied.

8. Indemnification
You agree to indemnify HDM ERP against claims arising from your use of the software.

9. Termination
This license terminates upon subscription expiry or violation of terms. You must cease use immediately.

10. Contact
For licensing inquiries, contact support@hdmerp.com or +254 768 784 909.`
  },
  {
    type: 'cookie_policy', title: 'Cookie Policy',
    content: `1. What Are Cookies
Cookies are small text files stored on your device when you visit our website.

2. Essential Cookies
These cookies are necessary for authentication, session management, and security. They cannot be disabled.

3. Preference Cookies
These cookies remember your preferences such as language, currency, and theme settings.

4. Analytics Cookies
We use analytics cookies to understand how users interact with the platform and improve performance.

5. Third-Party Cookies
Stripe and M-Pesa may set cookies during payment processing. We do not control these cookies.

6. Cookie Duration
Session cookies expire when you close your browser. Persistent cookies remain for up to 12 months.

7. Managing Cookies
You can disable cookies in your browser settings, but some features may not function properly.

8. Consent
By using HDM ERP, you consent to our use of cookies as described in this policy.

9. Policy Updates
We may update this cookie policy. Changes will be posted on this page.

10. Contact
For questions about our cookie practices, contact support@hdmerp.com or +254 768 784 909.`
  }
];

const defaultFAQs = {
  questions: [
    { q: 'What is HDM ERP?', a: 'A comprehensive business management platform that helps you manage finances, HR, sales, inventory, supply chain, and manufacturing from one unified system powered by AI.' },
    { q: 'How do I get started?', a: 'Register your company on our platform, choose a plan that fits your needs, complete payment, and start using HDM ERP immediately.' },
    { q: 'What payment methods do you accept?', a: 'We accept M-Pesa (STK Push, Send Money to 0768784909, Paybill, Till), Stripe (credit/debit cards), and bank transfers.' },
    { q: 'Can I upgrade my plan later?', a: 'Yes! You can upgrade from any plan to a higher tier at any time from your billing settings. Prorated charges apply.' },
    { q: 'Is there a free trial?', a: 'Yes, we offer a 14-day free trial with access to core modules. No credit card required.' },
    { q: 'How does AI work in HDM ERP?', a: 'Our AI assistant analyzes your business data and answers questions about finances, inventory, and more. You can also bring your own API key from OpenAI, Claude, or other providers.' },
    { q: 'What currencies do you support?', a: 'We support KSh (Kenyan Shilling), USD, EUR, and GBP. Admin can change the system currency anytime.' },
    { q: 'How secure is my data?', a: 'All data is encrypted at rest and in transit. We use JWT authentication, role-based access control, and tenant isolation.' },
    { q: 'Can I export my data?', a: 'Yes, all records can be exported to CSV or PDF. Backups can be scheduled automatically.' },
    { q: 'How do I contact support?', a: 'Email support@hdmerp.com or call +254 768 784 909. Enterprise plans include dedicated support.' }
  ]
};

// ---------------------------------------------------------------------------
// Seed functions
// ---------------------------------------------------------------------------
const seedAdmin = async () => {
  const existing = await Admin.findOne({ email: defaultAdmin.email });
  if (existing) { warn('Admin already exists, skipping.'); return; }
  await Admin.create(defaultAdmin);
  log('✅ Super admin created.');
};

const seedPlans = async () => {
  await Plan.deleteMany({});
  await Plan.insertMany(defaultPlans);
  log(`✅ ${defaultPlans.length} plans seeded.`);
};

const seedSettings = async () => {
  await SystemSettings.deleteMany({});
  await SystemSettings.create(defaultSettings);
  log('✅ System settings seeded (maintenance OFF, M-Pesa Send Money: 0768784909).');
};

const seedAIConfig = async () => {
  await AIConfig.deleteMany({});
  await AIConfig.create(defaultAIConfig);
  log('✅ AI config seeded (all features ON, chatbot green).');
};

const seedLanding = async () => {
  await LandingPageConfig.deleteMany({});
  await LandingPageConfig.create({ ...defaultLandingConfig, faqs: defaultFAQs });
  log('✅ Landing page config seeded (with 10 FAQs).');
};

const seedLegal = async () => {
  await LegalContent.deleteMany({});
  await LegalContent.insertMany(defaultLegalDocs);
  log(`✅ ${defaultLegalDocs.length} legal documents seeded (numbered 1-10).`);
};

const seedBackupSettings = async () => {
  const existing = await BackupSettings.findOne();
  if (existing) { warn('Backup settings already exist, skipping.'); return; }
  await BackupSettings.create({ enabled: false, frequency: 'daily', time: '02:00', retention: { keepDays: 30, maxBackups: 10 } });
  log('✅ Backup settings seeded.');
};

const seedFAQs = async () => {
  await LandingPageConfig.findOneAndUpdate({}, { faqs: defaultFAQs }, { upsert: true });
  log('✅ FAQs seeded (10 questions).');
};

const seedAll = async () => {
  header('SEEDING ALL');
  await seedAdmin();
  await seedPlans();
  await seedSettings();
  await seedAIConfig();
  await seedLanding();
  await seedLegal();
  await seedBackupSettings();
  log('\n🎉 All seed data created successfully!');
};

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------
const menu = async () => {
  while (true) {
    console.log(`\n${bold}${cyan}╔══════════════════════════════════════╗${reset}`);
    console.log(`${bold}${cyan}║        HDM ERP — SEED TOOL           ║${reset}`);
    console.log(`${bold}${cyan}╠══════════════════════════════════════╣${reset}`);
    console.log(`${bold}${cyan}║${reset}  ${green}1.${reset} Seed ALL                         ${bold}${cyan}║${reset}`);
    console.log(`${bold}${cyan}║${reset}  ${green}2.${reset} Seed admin only                  ${bold}${cyan}║${reset}`);
    console.log(`${bold}${cyan}║${reset}  ${green}3.${reset} Seed plans only                  ${bold}${cyan}║${reset}`);
    console.log(`${bold}${cyan}║${reset}  ${green}4.${reset} Seed system settings             ${bold}${cyan}║${reset}`);
    console.log(`${bold}${cyan}║${reset}  ${green}5.${reset} Seed AI config                   ${bold}${cyan}║${reset}`);
    console.log(`${bold}${cyan}║${reset}  ${green}6.${reset} Seed landing page config         ${bold}${cyan}║${reset}`);
    console.log(`${bold}${cyan}║${reset}  ${green}7.${reset} Seed legal documents             ${bold}${cyan}║${reset}`);
    console.log(`${bold}${cyan}║${reset}  ${green}8.${reset} Seed backup settings             ${bold}${cyan}║${reset}`);
    console.log(`${bold}${cyan}║${reset}  ${green}9.${reset} Seed FAQs only                   ${bold}${cyan}║${reset}`);
    console.log(`${bold}${cyan}║${reset}  ${green}0.${reset} Exit                             ${bold}${cyan}║${reset}`);
    console.log(`${bold}${cyan}╚══════════════════════════════════════╝${reset}`);

    const choice = await question('\n  > ');
    try {
      switch (choice) {
        case '1': await seedAll(); break;
        case '2': await seedAdmin(); break;
        case '3': await seedPlans(); break;
        case '4': await seedSettings(); break;
        case '5': await seedAIConfig(); break;
        case '6': await seedLanding(); break;
        case '7': await seedLegal(); break;
        case '8': await seedBackupSettings(); break;
        case '9': await seedFAQs(); break;
        case '0': log('\n  Goodbye! 👋\n'); rl.close(); await mongoose.connection.close(); process.exit(0);
        default: warn('  Invalid option.');
      }
    } catch (er) { err(`  Error: ${er.message}`); }
  }
};

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
(async () => {
  console.log(`${green}${bold}`);
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║          HDM ERP — SEED TOOL                ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`${reset}`);

  try {
    await mongoose.connect(MONGODB_URI);
    log(`Connected to: ${MONGODB_URI}\n`);
    await menu();
  } catch (er) {
    err(`Connection failed: ${er.message}`);
    rl.close();
    process.exit(1);
  }
})();