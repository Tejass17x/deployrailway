const Presence = require('./Presence');
const SocketSession = require('../sessions/SocketSession');
const Conversation = require('../../modules/messaging/model/Conversation');
const logger = require('../../common/logger/winston');
const redisClient = require('../../config/redis');

class PresenceManager {
  /**
   * Set user online (registers new socket session)
   */
  async setUserOnline(userId, socketId, metadata = {}, io) {
    if (!userId) {
      logger.warn(`setUserOnline called with undefined userId for socket: ${socketId}`);
      return;
    }

    try {
      const userIdStr = userId.toString();
      const now = new Date();

      // 1. Log socket session in database
      await SocketSession.findOneAndUpdate(
        { socketId },
        {
          socketId,
          userId: userIdStr,
          device: metadata.device || 'desktop',
          platform: metadata.platform || 'unknown',
          browser: metadata.browser || 'unknown',
          ip: metadata.ip || '127.0.0.1',
          connectedAt: now,
          lastHeartbeat: now
        },
        { upsert: true }
      );

      // 2. Track sockets in Redis Set
      let wasOffline = true;
      if (redisClient && redisClient.isOpen && redisClient.isReady) {
        try {
          const key = `user:${userIdStr}:sockets`;
          const socketCount = await redisClient.sCard(key);
          
          // Add to set
          await redisClient.sAdd(key, socketId);
          await redisClient.expire(key, 86400); // 24h safety expiry
          
          if (socketCount > 0) {
            wasOffline = false;
          }
        } catch (err) {
          logger.error(`Redis setSockets failed: ${err.message}`);
        }
      } else {
        // Fallback: Check MongoDB socket sessions count
        const sessionsCount = await SocketSession.countDocuments({ userId: userIdStr });
        // Since we already saved the current session above, if it's > 1, then they were already online
        if (sessionsCount > 1) {
          wasOffline = false;
        }
      }

      // 3. Update database presence record
      await Presence.findOneAndUpdate(
        { userId: userIdStr },
        {
          userId: userIdStr,
          status: 'online',
          isOnline: true,
          socketId,
          device: metadata.device || 'desktop',
          browser: metadata.browser || 'unknown',
          platform: metadata.platform || 'unknown',
          lastActive: now
        },
        { upsert: true }
      );

      // Cache status and details in Redis
      if (redisClient && redisClient.isOpen && redisClient.isReady) {
        try {
          await redisClient.set(`presence:status:${userIdStr}`, 'online', { EX: 86400 });
          
          const detailsKey = `presence:details:${userIdStr}`;
          await redisClient.hSet(detailsKey, {
            isOnline: 'true',
            lastSeen: now.toISOString(),
            socketId,
            device: metadata.device || 'desktop',
            browser: metadata.browser || 'unknown',
            platform: metadata.platform || 'unknown',
            updatedAt: now.toISOString()
          });
          await redisClient.expire(detailsKey, 86400);
        } catch (err) {
          logger.error(`Redis details cache failed: ${err.message}`);
        }
      }

      // 4. Broadcast status change to contacts if they just logged on
      if (wasOffline && io) {
        logger.info(`Presence: User ${userIdStr} is now ONLINE.`);
        await this.broadcastPresence(userIdStr, 'online', null, io);
      }
    } catch (err) {
      logger.error(`Failed setting user online in presence manager: ${err.message}`);
    }
  }

  /**
   * Disconnects a specific socket session and sets user offline after a 15-second grace period if no sockets remain
   */
  async setUserOffline(userId, socketId, io) {
    if (!userId) {
      logger.warn(`setUserOffline called with undefined userId for socket: ${socketId}`);
      return;
    }

    try {
      const userIdStr = userId.toString();

      // 1. Remove socket session from DB
      await SocketSession.deleteOne({ socketId });

      // 2. Remove socket from Redis Set
      let remainingCount = 0;
      if (redisClient && redisClient.isOpen && redisClient.isReady) {
        try {
          const key = `user:${userIdStr}:sockets`;
          await redisClient.sRem(key, socketId);
          remainingCount = await redisClient.sCard(key);
        } catch (err) {
          logger.error(`Redis sRem failed: ${err.message}`);
        }
      } else {
        remainingCount = await SocketSession.countDocuments({ userId: userIdStr });
      }

      // 3. If no active sockets remain, start the 15-second grace period timeout
      if (remainingCount === 0) {
        logger.info(`Presence: User ${userIdStr} has no active sockets. Starting 15s offline grace period.`);
        
        setTimeout(async () => {
          try {
            // Re-verify if any socket connects back during the grace period
            let finalCount = 0;
            if (redisClient && redisClient.isOpen && redisClient.isReady) {
              finalCount = await redisClient.sCard(`user:${userIdStr}:sockets`);
            } else {
              finalCount = await SocketSession.countDocuments({ userId: userIdStr });
            }

            // If still no sockets, commit the user offline status
            if (finalCount === 0) {
              const lastSeen = new Date();
              
              await Presence.findOneAndUpdate(
                { userId: userIdStr },
                {
                  status: 'offline',
                  isOnline: false,
                  lastSeen
                }
              );

              // Update status in Redis
              if (redisClient && redisClient.isOpen && redisClient.isReady) {
                try {
                  await redisClient.set(`presence:status:${userIdStr}`, 'offline', { EX: 86400 });
                  await redisClient.hSet(`presence:details:${userIdStr}`, {
                    isOnline: 'false',
                    lastSeen: lastSeen.toISOString(),
                    updatedAt: lastSeen.toISOString()
                  });
                } catch (err) {
                  logger.error(`Redis offline cache update failed: ${err.message}`);
                }
              }

              // Broadcast offline presence to contacts
              if (io) {
                logger.info(`Presence: User ${userIdStr} is now OFFLINE.`);
                await this.broadcastPresence(userIdStr, 'offline', lastSeen, io);
              }
            } else {
              logger.info(`Presence: User ${userIdStr} reconnected during grace period. Staying online.`);
            }
          } catch (timeoutErr) {
            logger.error(`Failed during offline grace period execution: ${timeoutErr.message}`);
          }
        }, 15000);
      }
    } catch (err) {
      logger.error(`Failed setting user offline in presence manager: ${err.message}`);
    }
  }

  /**
   * Change user status (e.g. to idle, busy, away) manually
   */
  async setUserStatus(userId, status, io) {
    if (!userId) {
      logger.warn('setUserStatus called with undefined userId');
      return;
    }

    try {
      const userIdStr = userId.toString();
      const isOnline = status === 'online';

      await Presence.findOneAndUpdate(
        { userId: userIdStr },
        { status, isOnline, lastActive: new Date() }
      );

      // Cache status in Redis
      if (redisClient && redisClient.isOpen && redisClient.isReady) {
        try {
          await redisClient.set(`presence:status:${userIdStr}`, status, { EX: 86400 });
          await redisClient.hSet(`presence:details:${userIdStr}`, {
            isOnline: isOnline ? 'true' : 'false',
            updatedAt: new Date().toISOString()
          });
        } catch (err) {
          logger.error(`Redis status cache failed: ${err.message}`);
        }
      }

      if (io) {
        await this.broadcastPresence(userIdStr, status, null, io);
      }
    } catch (err) {
      logger.error(`Failed changing user status in presence manager: ${err.message}`);
    }
  }

  /**
   * Broadcast presence updates to all active conversation contacts of the user
   */
  async broadcastPresence(userId, status, lastSeen, io) {
    try {
      const conversations = await Conversation.find({ participants: userId }).select('participants').lean();
      
      conversations.forEach(c => {
        const otherId = c.participants.find(p => p.toString() !== userId.toString());
        if (otherId) {
          // Emit compatibility presence:update
          io.to(`user:${otherId}`).emit('presence:update', {
            userId,
            status,
            lastSeen
          });

          // Emit precise WhatsApp events
          if (status === 'online') {
            io.to(`user:${otherId}`).emit('USER_ONLINE', {
              userId,
              isOnline: true,
              lastSeen: null
            });
          } else {
            io.to(`user:${otherId}`).emit('USER_OFFLINE', {
              userId,
              isOnline: false,
              lastSeen
            });
          }
        }
      });
    } catch (err) {
      logger.error(`Failed broadcasting presence: ${err.message}`);
    }
  }

  /**
   * Helper to inspect online status
   */
  async isUserOnline(userId) {
    try {
      if (redisClient && redisClient.isOpen && redisClient.isReady) {
        const cached = await redisClient.get(`presence:status:${userId}`);
        if (cached) {
          return cached === 'online';
        }
      }
      const presence = await Presence.findOne({ userId }).lean();
      if (presence && redisClient && redisClient.isOpen && redisClient.isReady) {
        await redisClient.set(`presence:status:${userId}`, presence.status, { EX: 86400 });
      }
      return presence ? presence.isOnline : false;
    } catch (err) {
      return false;
    }
  }
}

module.exports = new PresenceManager();
