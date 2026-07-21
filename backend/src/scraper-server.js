const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const logger = require('./common/logger/winston');
const { connectDB } = require('./config/database/connection');
const redisClient = require('./config/redis');

// Import all models to ensure schemas are registered
require('./config/database/indexes');

const startScraperServer = async () => {
  try {
    logger.info('Starting Google Scholar Scraper Server...');

    // 1. Establish Database Connection
    await connectDB();

    // 2. Establish Redis Connection
    try {
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
    } catch (redisErr) {
      logger.error('Failed to connect to Redis on Scraper Server startup:', redisErr.message);
    }

    // 3. Initialize Scholar import queue worker
    try {
      const importQueueService = require('./modules/scholar/service/import-queue.service');
      importQueueService.runQueueWorker();
      logger.info('🚀 Scholar Import Queue Worker successfully running.');
    } catch (err) {
      logger.error('Failed to run Scholar queue worker:', err);
    }

    logger.info('🚀 Decoupled Scraper Server initialized and listening to the scholar_import queue.');

    // Handle Graceful Shutdowns
    const shutdownGracefully = async (signal) => {
      logger.info(`Received ${signal}. Shutting down Scraper Server gracefully...`);
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));
    process.on('SIGINT', () => shutdownGracefully('SIGINT'));

  } catch (error) {
    logger.error('Error starting Decoupled Scraper Server:', error);
    process.exit(1);
  }
};

startScraperServer();
