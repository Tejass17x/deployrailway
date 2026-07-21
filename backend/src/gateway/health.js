const express = require('express');
const router = express.Router();
const { checkHealth: checkDbHealth } = require('../config/database/connection');
const redisClient = require('../config/redis');

/**
 * Liveness probe: verifies if the Express gateway process is alive.
 */
router.get('/liveness', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

/**
 * Readiness probe: verifies if critical internal services (MongoDB + Redis) are operational.
 */
router.get('/readiness', async (req, res) => {
  const dbHealth = checkDbHealth();
  
  const redisConnected = redisClient && redisClient.isOpen && redisClient.isReady;
  const isHealthy = dbHealth.isHealthy && redisConnected;

  const responsePayload = {
    status: isHealthy ? 'READY' : 'DEGRADED',
    timestamp: new Date(),
    components: {
      database: {
        status: dbHealth.status,
        healthy: dbHealth.isHealthy,
        replicaSet: dbHealth.replicaSet
      },
      redis: {
        status: redisConnected ? 'connected' : 'disconnected',
        healthy: redisConnected
      }
    }
  };

  if (isHealthy) {
    res.status(200).json(responsePayload);
  } else {
    res.status(503).json(responsePayload);
  }
});

module.exports = router;
