require('./dnsSet');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const config = require('./config/env');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { initBackupSystem } = require('./config/backup');
const { startProactiveAlerts } = require('./services/aiSchedulerService');
const maintenanceCheck = require('./middleware/maintenance');
const webhookRoutes = require('./routes/public/webhookRoutes');
const mainRoutes = require('./routes');

const app = express();

// Ensure required directories exist
const dirs = [
  path.resolve(__dirname, 'logs'),
  path.resolve(__dirname, 'backups'),
  path.resolve(__dirname, 'backups', 'system'),
  path.resolve(__dirname, 'backups', 'tenants')
];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Security
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true
}));

app.use('/api/webhooks', webhookRoutes);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Maintenance mode
app.use(maintenanceCheck);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) logger.warn(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Health + Info
app.get('/', (req, res) => res.json({ success: true, name: 'HDM ERP API', version: '1.0.0', environment: config.nodeEnv, timestamp: new Date().toISOString() }));
app.get('/api', (req, res) => res.json({ success: true, name: 'HDM ERP API', version: '1.0.0', health: '/health', timestamp: new Date().toISOString() }));
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }));

// API routes
app.use('/api', mainRoutes);

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Endpoint not found' }));

// Error handler
app.use((err, req, res, _next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start
const startServer = async () => {
  logger.info('Starting HDM ERP server...');
  await connectDB();
  try { await initBackupSystem(); } catch (err) { logger.warn('Backup init failed:', err.message); }
  try { startProactiveAlerts(); } catch (err) { logger.warn('Alerts init failed:', err.message); }

  const server = app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} [${config.nodeEnv}]`);
  });

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down...`);
    server.close(async () => {
      try { const mongoose = require('mongoose'); await mongoose.connection.close(); logger.info('MongoDB disconnected'); } catch (err) { logger.error('Disconnect error:', err.message); }
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

startServer();
module.exports = app;