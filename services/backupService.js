const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const BackupRecord = require('../models/master/BackupRecord');
const BackupSettings = require('../models/master/BackupSettings');
const Tenant = require('../models/master/Tenant');
const logger = require('../utils/logger');
const sendEmail = require('../utils/sendEmail');
const config = require('../config/env');

const runSystemBackup = async () => {
  const collections = await mongoose.connection.db.listCollections().toArray();
  const backupData = {};
  const systemCollections = ['admins', 'tenants', 'plans', 'subscriptions', 'pendingactivations', 'licensekeys', 'systemsettings', 'backupsettings', 'backuprecords', 'aiconfigs', 'landingpageconfigs', 'legalcontents'];
  for (const col of collections) {
    if (systemCollections.includes(col.name)) {
      backupData[col.name] = await mongoose.connection.db.collection(col.name).find({}).toArray();
    }
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `system_backup_${timestamp}.json`;
  const filePath = path.join(config.backupDir, 'system', filename);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
  const stats = fs.statSync(filePath);
  await BackupRecord.create({
    filename,
    type: 'system',
    sizeBytes: stats.size,
    status: 'success'
  });
  logger.info(`System backup created: ${filename}`);
};

const runTenantBackups = async () => {
  const tenants = await Tenant.find({ status: 'active' });
  for (const tenant of tenants) {
    try {
      const tenantCollections = ['users', 'companysettings', 'contacts', 'products', 'salesorders', 'purchaseorders', 'workorders', 'invoices', 'bills', 'payments', 'journalentries', 'accounts', 'taxes', 'employees', 'attendances', 'leaves', 'payrolls', 'inventorymovements', 'warehouses', 'billofmaterials', 'reports'];
      const backupData = {};
      for (const name of tenantCollections) {
        const docs = await mongoose.connection.db.collection(name).find({ tenantId: tenant._id }).toArray();
        if (docs.length) backupData[name] = docs;
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const dir = path.join(config.backupDir, 'tenants', `${tenant.companyName}_${tenant._id}`);
      fs.mkdirSync(dir, { recursive: true });
      const filename = `tenant_backup_${timestamp}.json`;
      const filePath = path.join(dir, filename);
      fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
      const stats = fs.statSync(filePath);
      await BackupRecord.create({
        filename,
        type: 'tenant',
        tenant: tenant._id,
        sizeBytes: stats.size,
        status: 'success'
      });
      logger.info(`Tenant backup created: ${filename}`);
    } catch (err) {
      logger.error(`Tenant backup failed for ${tenant.companyName}: ${err.message}`);
    }
  }
};

const runAllBackups = async () => {
  await runSystemBackup();
  await runTenantBackups();
  await cleanupOldBackups();
};

const cleanupOldBackups = async () => {
  const settings = await BackupSettings.findOne();
  if (!settings) return;
  const records = await BackupRecord.find().sort({ createdAt: -1 }).lean();
  const maxBackups = settings.retention.maxBackups;
  const keepDays = settings.retention.keepDays;
  const cutoff = new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000);
  
  const toDelete = records.filter((rec, idx) => idx >= maxBackups || (rec.createdAt < cutoff));
  for (const rec of toDelete) {
    let filePath;
    if (rec.type === 'system') {
      filePath = path.join(config.backupDir, 'system', rec.filename);
    } else if (rec.tenant) {
      const tenant = await Tenant.findById(rec.tenant);
      filePath = path.join(config.backupDir, 'tenants', `${tenant.companyName}_${tenant._id}`, rec.filename);
    }
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await BackupRecord.findByIdAndDelete(rec._id);
  }
};

const emailBackup = async (email, filePath) => {
  // Not fully implemented for brevity; could attach file via Brevo API
  logger.info(`Sending backup to ${email}`);
};

module.exports = { runSystemBackup, runTenantBackups, runAllBackups };