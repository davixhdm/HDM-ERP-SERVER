const cron = require('node-cron');
const BackupSettings = require('../models/master/BackupSettings');
const backupService = require('../services/backupService');
const logger = require('../utils/logger');

let scheduledTask = null;

const initBackupSystem = async () => {
  try {
    const settings = await BackupSettings.findOne();
    if (settings && settings.enabled) {
      scheduleBackup(settings);
    }
    logger.info('Backup system initialized');
  } catch (error) {
    logger.error('Backup system init failed:', error.message);
  }
};

const scheduleBackup = (settings) => {
  if (scheduledTask) {
    scheduledTask.stop();
  }

  let cronExpression;
  switch (settings.frequency) {
    case 'daily':
      cronExpression = `0 ${settings.time.split(':')[1]} ${settings.time.split(':')[0]} * * *`;
      break;
    case 'weekly':
      cronExpression = `0 ${settings.time.split(':')[1]} ${settings.time.split(':')[0]} * * 0`;
      break;
    case 'monthly':
      cronExpression = `0 ${settings.time.split(':')[1]} ${settings.time.split(':')[0]} 1 * *`;
      break;
    case 'custom':
      cronExpression = settings.cronExpression;
      break;
    default:
      return;
  }

  if (cronExpression && cron.validate(cronExpression)) {
    scheduledTask = cron.schedule(cronExpression, async () => {
      try {
        await backupService.runAllBackups();
      } catch (err) {
        logger.error('Scheduled backup failed:', err.message);
      }
    });
    logger.info(`Backup scheduled: ${cronExpression}`);
  }
};

module.exports = { initBackupSystem, scheduleBackup };