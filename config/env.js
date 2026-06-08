const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const defaults = {
  PORT: '5000',
  NODE_ENV: 'development',
  MONGODB_URI: 'mongodb://localhost:27017/hdm_erp',
  JWT_SECRET: 'dev_jwt_secret_change_in_prod',
  JWT_REFRESH_SECRET: 'dev_refresh_secret',
  JWT_EXPIRES_IN: '7d',
  ADMIN_EMAIL: 'davismcintyre5@gmail.com',
  ADMIN_PASSWORD: 'Hdm@2002',
  CORS_ORIGINS: 'https://hdmerp.pxxl.click,https://hdm-admin.pxxl.click,app://hdmerp,hdmerp://mobile,http://localhost:3000,http://localhost:3001,http://localhost:5173',
  CLIENT_URL: 'https://hdmerp.pxxl.click',
  ADMIN_URL: 'https://hdm-admin.pxxl.click',
  LANDING_URL: 'https://hdmerp.pxxl.click',
  HDM_EMAIL_API_KEY: '',
  HDM_EMAIL_API_URL: 'https://hdmbridgeserver.pxxl.click/api',
  HDM_EMAIL_FROM: 'noreply@hdmerp.com',
  HDM_EMAIL_FROM_NAME: 'HDM ERP',
  CLOUDINARY_CLOUD_NAME: '',
  CLOUDINARY_API_KEY: '',
  CLOUDINARY_API_SECRET: '',
  STRIPE_SECRET_KEY: '',
  STRIPE_WEBHOOK_SECRET: '',
  MPESA_CONSUMER_KEY: '',
  MPESA_CONSUMER_SECRET: '',
  MPESA_PASSKEY: '',
  MPESA_SHORTCODE: '174379',
  MPESA_ENVIRONMENT: 'sandbox',
  HDM_AI_BASE_URL: 'https://hdmai-server.onrender.com/api/v1',
  HDM_AI_API_KEY: 'hdm_erp_f10c05018a390678378c40dbb110f6c6e09963eeebc111f6',
  HDM_AI_ENABLED: 'true',
  ENCRYPTION_KEY: 'hdm_erp_encryption_key_32_chars_min'
};

const warn = (key) => {
  if (!process.env[key]) console.warn(`[WARN] Missing env: ${key} — using default.`);
};

module.exports = {
  port: parseInt(process.env.PORT || defaults.PORT, 10),
  nodeEnv: process.env.NODE_ENV || defaults.NODE_ENV,
  mongodbUri: (() => { warn('MONGODB_URI'); return process.env.MONGODB_URI || defaults.MONGODB_URI; })(),
  jwtSecret: (() => { warn('JWT_SECRET'); return process.env.JWT_SECRET || defaults.JWT_SECRET; })(),
  jwtRefreshSecret: (() => { warn('JWT_REFRESH_SECRET'); return process.env.JWT_REFRESH_SECRET || defaults.JWT_REFRESH_SECRET; })(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || defaults.JWT_EXPIRES_IN,
  adminEmail: process.env.ADMIN_EMAIL || defaults.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD || defaults.ADMIN_PASSWORD,
  corsOrigins: (process.env.CORS_ORIGINS || defaults.CORS_ORIGINS).split(',').map(s => s.trim()),
  clientUrl: process.env.CLIENT_URL || defaults.CLIENT_URL,
  adminUrl: process.env.ADMIN_URL || defaults.ADMIN_URL,
  landingUrl: process.env.LANDING_URL || defaults.LANDING_URL,
  hdmEmail: {
    apiKey: process.env.HDM_EMAIL_API_KEY || defaults.HDM_EMAIL_API_KEY,
    apiUrl: process.env.HDM_EMAIL_API_URL || defaults.HDM_EMAIL_API_URL,
    fromEmail: process.env.HDM_EMAIL_FROM || defaults.HDM_EMAIL_FROM,
    fromName: process.env.HDM_EMAIL_FROM_NAME || defaults.HDM_EMAIL_FROM_NAME,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || defaults.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY || defaults.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET || defaults.CLOUDINARY_API_SECRET
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || defaults.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || defaults.STRIPE_WEBHOOK_SECRET
  },
  mpesa: {
    consumerKey: process.env.MPESA_CONSUMER_KEY || defaults.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || defaults.MPESA_CONSUMER_SECRET,
    passkey: process.env.MPESA_PASSKEY || defaults.MPESA_PASSKEY,
    shortcode: process.env.MPESA_SHORTCODE || defaults.MPESA_SHORTCODE,
    environment: process.env.MPESA_ENVIRONMENT || defaults.MPESA_ENVIRONMENT
  },
  hdmAi: {
    baseUrl: process.env.HDM_AI_BASE_URL || defaults.HDM_AI_BASE_URL,
    apiKey: process.env.HDM_AI_API_KEY || defaults.HDM_AI_API_KEY,
    enabled: process.env.HDM_AI_ENABLED !== 'false'
  },
  encryptionKey: process.env.ENCRYPTION_KEY || defaults.ENCRYPTION_KEY,
  backupDir: path.resolve(__dirname, '../backups')
};