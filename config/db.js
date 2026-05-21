const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    logger.warn('Server will continue without database – some features will be unavailable.');
    // Do NOT exit the process
  }
};

module.exports = connectDB;