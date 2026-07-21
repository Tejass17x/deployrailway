const { Server } = require('socket.io');
const logger = require('../../common/logger/winston');
const { socketAuthMiddleware, socketRateLimiter } = require('../middleware/socket.middleware');
const presenceManager = require('../presence/presence.manager');
const roomManager = require('../rooms/room.manager');
const SocketSession = require('../sessions/SocketSession');
const redisClient = require('../../config/redis');
const env = require('../../config/environment');
const { parseBrowser, parsePlatform, getDeviceType } = require('../../common/utils/userAgent.helper');

class SocketGateway {
  constructor() {
    this.io = null;
    this.emitter = null;
    this.heartbeatIntervalId = null;
  }

  getEmitter() {
    if (!this.emitter && redisClient && redisClient.isOpen) {
      const { Emitter } = require('@socket.io/redis-emitter');
      this.emitter = new Emitter(redisClient);
    }
    return this.emitter;
  }

  /**
   * Initialize Socket.IO server
   */
  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: env.clientUrl,
        methods: ['GET', 'POST']
      },
      pingTimeout: 20000,
      pingInterval: 25000
    });

    // Configure Socket.IO Redis Adapter for horizontal scaling (optional)
    if (redisClient && redisClient.isOpen && !redisClient.isLimitExceeded) {
      try {
        const pubClient = redisClient.duplicate();
        const subClient = redisClient.duplicate();
        Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
          const { createAdapter } = require('@socket.io/redis-adapter');
          this.io.adapter(createAdapter(pubClient, subClient));
          logger.info('Socket.IO Redis Adapter configured successfully.');
        }).catch((err) => {
          logger.warn('Redis Adapter unavailable. Running Socket.IO without Redis adapter.');
        });
      } catch (err) {
        logger.warn('Redis unavailable for Socket.IO Adapter. Running in standalone mode.');
      }
    } else {
      logger.info('Redis not available. Socket.IO running in standalone mode.');
    }

    // Clean up all socket sessions on startup to avoid stale DB entries
    SocketSession.deleteMany({}).catch((err) => {
      logger.error(`Failed to clean up stale socket sessions: ${err.message}`);
    });

    // 1. Mount auth and rate limiters
    this.io.use(socketAuthMiddleware);
    this.io.use(socketRateLimiter);

    // 2. Handle connections
    this.io.on('connection', async (socket) => {
      try {
        const userId = socket.user.userId || socket.user.id || socket.user._id;
        const socketId = socket.id;

        // Parse user-agent info
        const userAgentStr = socket.handshake.headers['user-agent'] || '';
        const ip = socket.handshake.address || '';
        
        const browser = parseBrowser(userAgentStr);
        const platform = parsePlatform(userAgentStr);

        logger.info(`🔌 Enterprise Socket connected: User ${userId} (${socketId}) on ${platform}/${browser}`);

        // Set user online
        await presenceManager.setUserOnline(userId, socketId, {
          device: getDeviceType(userAgentStr),
          platform,
          browser,
          ip
        }, this.io);

        // Join default namespaces rooms
        roomManager.joinUserRooms(socket);

        // NOTE: Redesigned multi-device support - DO NOT disconnect older sockets of the same user.
        // Multiple tabs and devices are tracked together in the Redis Set user:{userId}:sockets.

        // Register notifications socket router
        try {
          require('../../modules/notifications/socket/notification.socket')(this.io, socket);
        } catch (err) {
          logger.error(`Failed mounting notification socket listeners: ${err.message}`);
        }

        // Register messaging socket router
        try {
          require('../../modules/messaging/socket/message.socket')(this.io, socket);
        } catch (err) {
          logger.error(`Failed mounting messaging socket listeners: ${err.message}`);
        }

        // Register call socket router (Redesigned)
        try {
          require('../../modules/messaging/socket/call.socket')(this.io, socket);
        } catch (err) {
          logger.error(`Failed mounting call socket listeners: ${err.message}`);
        }

        // Register collaborations socket router
        try {
          require('../../modules/collaborations/socket/collaboration.socket')(this.io, socket);
        } catch (err) {
          logger.error(`Failed mounting collaboration socket listeners: ${err.message}`);
        }

        // Register project socket router
        try {
          require('../../modules/project/socket/project.socket')(this.io, socket);
        } catch (err) {
          logger.error(`Failed mounting project socket listeners: ${err.message}`);
        }

        // Disconnect
        socket.on('disconnect', async (reason) => {
          try {
            logger.info(`🔌 Enterprise Socket disconnected: User ${userId} (${socketId}). Reason: ${reason}`);
            await presenceManager.setUserOffline(userId, socketId, this.io);
          } catch (err) {
            logger.error(`Socket disconnect handler failed: ${err.message}`);
          }
        });
      } catch (err) {
        logger.error(`Socket connection logic failed: ${err.message}`);
      }
    });

    return this.io;
  }

  /**
   * Stop background timers on shutdown
   */
  destroy() {
    // Timer removed, heartbeat handled natively by Socket.IO
  }

  getIO() {
    return this.io; // Return null instead of throwing error in decoupled REST server mode
  }

  emitToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
    } else {
      const emitter = this.getEmitter();
      if (emitter) {
        emitter.to(`user:${userId}`).emit(event, data);
      }
    }
  }

  emitToRoom(roomId, event, data) {
    if (this.io) {
      this.io.to(roomId).emit(event, data);
    } else {
      const emitter = this.getEmitter();
      if (emitter) {
        emitter.to(roomId).emit(event, data);
      }
    }
  }
}

module.exports = new SocketGateway();
