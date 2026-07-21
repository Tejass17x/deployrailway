const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const http = require('http');
const logger = require('./common/logger/winston');
const { connectDB } = require('./config/database/connection');
const redisClient = require('./config/redis');
const socketInfrastructure = require('./socket');

const PORT = process.env.SOCKET_PORT || 5001;

const startSocketServer = async () => {
  try {
    // 1. Establish Database Connection (needed for socket auth/session/profile models)
    await connectDB();

    // 2. Establish Redis Connection
    try {
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
    } catch (redisErr) {
      logger.error('Failed to connect to Redis on Socket Server startup:', redisErr.message);
    }

    // 3. Initialize Express & HTTP Server
    const app = express();
    const server = http.createServer(app);

    // Health check endpoint for Socket Server
    app.get('/health', (req, res) => {
      res.status(200).json({ success: true, message: 'Socket server is healthy' });
    });

    // 4. Initialize Socket.IO with the server
    const io = socketInfrastructure.init(server);

    server.listen(PORT, () => {
      logger.info(`🔌 Decoupled Socket Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });

    // Handle Graceful Shutdowns
    const shutdownGracefully = async (signal) => {
      logger.info(`Received ${signal}. Shutting down Socket Server gracefully...`);
      server.close(() => {
        logger.info('Socket Server HTTP server closed. Exiting process.');
        process.exit(0);
      });
      setTimeout(() => {
        logger.error('Forceful shutdown triggered.');
        process.exit(1);
      }, 5000);
    };

    process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));
    process.on('SIGINT', () => shutdownGracefully('SIGINT'));

  } catch (error) {
    logger.error('Error starting Decoupled Socket Server:', error);
    process.exit(1);
  }
};

startSocketServer();
