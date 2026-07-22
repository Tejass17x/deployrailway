const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, stack, category }) => {
    const catPrefix = category ? `[${category.toUpperCase()}] ` : '';
    return `[${timestamp}] ${level}: ${catPrefix}${stack || message}`;
  })
);

const isProduction = process.env.NODE_ENV === 'production';

// In production (Railway, Heroku, etc.), use /tmp/logs which is always writable.
// In development, use a local 'logs' folder in the project root.
const logDirectory = isProduction
  ? '/tmp/logs'
  : path.join(process.cwd(), 'logs');

const createCategoryLogger = (categoryName) => {
  const defaultLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

  // Every logger always gets a Console transport (stdout is captured by the platform)
  const transports = [
    new winston.transports.Console({
      format: consoleFormat,
      level: defaultLevel
    })
  ];

  // Only add file transports in production if /tmp is available (always is on
  // Railway / Heroku / Render, but guard defensively). In development, always
  // write file logs for local debugging.
  if (!isProduction || process.env.LOG_DIR !== 'false') {
    transports.push(
      new winston.transports.DailyRotateFile({
        filename: path.join(logDirectory, `${categoryName}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: logFormat
      })
    );

    // Re-route errors from any category to a shared error file as well
    if (categoryName !== 'error') {
      transports.push(
        new winston.transports.DailyRotateFile({
          filename: path.join(logDirectory, 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          level: 'error',
          format: logFormat
        })
      );
    }
  }

  return winston.createLogger({
    level: defaultLevel,
    format: logFormat,
    defaultMeta: { service: 'research-connect', category: categoryName },
    transports
  });
};

const appLogger = createCategoryLogger('application');
const apiLogger = createCategoryLogger('api');
const dbLogger = createCategoryLogger('mongodb');
const errorLogger = createCategoryLogger('error');
const authLogger = createCategoryLogger('auth');

const logger = {
  info: (msg, ...meta) => appLogger.info(msg, ...meta),
  error: (msg, ...meta) => errorLogger.error(msg, ...meta),
  warn: (msg, ...meta) => appLogger.warn(msg, ...meta),
  debug: (msg, ...meta) => appLogger.debug(msg, ...meta),
  app: appLogger,
  api: apiLogger,
  db: dbLogger,
  errorLogger: errorLogger,
  auth: authLogger
};

module.exports = logger;
