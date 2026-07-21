const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const logger = require('./common/logger/winston');
const { connectDB } = require('./config/database/connection');
const redisClient = require('./config/redis');

// Import all models to ensure schemas are registered
require('./config/database/indexes');

const startWorkerServer = async () => {
  try {
    logger.info('Starting Background Worker Server...');

    // 1. Establish Database Connection
    await connectDB();

    // 2. Establish Redis Connection
    try {
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
    } catch (redisErr) {
      logger.error('Failed to connect to Redis on Worker Server startup:', redisErr.message);
    }

    // 3. Initialize background worker loops
    try {
      // Identity Sync Queue Worker
      const identitySyncQueueService = require('./modules/identity/service/identitySyncQueue.service');
      identitySyncQueueService.runQueueWorker();
    } catch (err) {
      logger.error('Failed to run Identity Sync queue worker:', err);
    }

    try {
      // Standard Redis workers (Email, Notification, Files, Reports)
      const { initWorkers } = require('./jobs/workers');
      initWorkers();
    } catch (err) {
      logger.error('Failed to initialize background workers:', err);
    }

    logger.info('🚀 Decoupled Background Worker Server initialized and listening to queues.');

    // Handle Graceful Shutdowns
    const shutdownGracefully = async (signal) => {
      logger.info(`Received ${signal}. Shutting down Worker Server gracefully...`);
      // BullMQ workers clean up connection automatically on process exit, or we can close them if needed.
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));
    process.on('SIGINT', () => shutdownGracefully('SIGINT'));

  } catch (error) {
    logger.error('Error starting Decoupled Worker Server:', error);
    process.exit(1);
  }
};

startWorkerServer();
