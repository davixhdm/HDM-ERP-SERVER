const cron = require('node-cron');
const aiGateway = require('./aiGatewayService');
const logger = require('../utils/logger');

let task = null;

const startProactiveAlerts = () => {
  if (task) task.stop();
  // Run every 6 hours
  task = cron.schedule('0 */6 * * *', async () => {
    logger.info('Running proactive AI alerts...');
    try {
      await aiGateway.runProactiveAlerts();
      logger.info('Proactive alerts completed');
    } catch (err) {
      logger.error('Proactive alerts failed:', err.message);
    }
  });
};

const stopProactiveAlerts = () => {
  if (task) task.stop();
};

module.exports = { startProactiveAlerts, stopProactiveAlerts };