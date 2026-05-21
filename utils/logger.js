const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logDir = path.resolve(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const colors = {
  error: '\x1b[31m',   // red
  warn: '\x1b[33m',    // yellow
  info: '\x1b[36m',    // cyan
  debug: '\x1b[35m',   // magenta
  reset: '\x1b[0m'
};

const levelColors = {
  error: 'red',
  warn: 'yellow',
  info: 'cyan',
  debug: 'magenta'
};

winston.addColors(levelColors);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${colors.info}[${timestamp}]${colors.reset} ${level}: ${message}${metaStr}`;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: fileFormat,
  defaultMeta: { service: 'hdm-erp' },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 10
    }),
    new winston.transports.Console({
      format: consoleFormat
    })
  ]
});

module.exports = logger;