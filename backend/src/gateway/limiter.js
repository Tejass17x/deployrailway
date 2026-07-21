const redisClient = require('../config/redis');
const logger = require('../common/logger/winston');

/**
 * Redis-backed distributed rate limiting middleware.
 * Prevents Express in-memory state, allowing horizontal scaling behind load balancers.
 * Fallbacks to standard non-blocking next() if Redis is disconnected.
 */
const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute
  const max = options.max || 100; // max 100 requests per window
  const keyPrefix = options.keyPrefix || 'rl:gw';

  return async (req, res, next) => {
    // Treat API Gateway requests from local network or health check gracefully
    if (req.path === '/health/liveness' || req.path === '/health/readiness') {
      return next();
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const key = `${keyPrefix}:${ip}`;

    if (!redisClient || !redisClient.isOpen || !redisClient.isReady) {
      // Graceful fallback to prevent service interruption if Redis fails
      return next();
    }

    try {
      const current = await redisClient.incr(key);

      if (current === 1) {
        // Set expiry for window on first increment
        await redisClient.expire(key, Math.ceil(windowMs / 1000));
      }

      const ttl = await redisClient.ttl(key);

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current));
      res.setHeader('X-RateLimit-Reset', Date.now() + (ttl * 1000));

      if (current > max) {
        logger.warn(`[RATE LIMIT EXCEEDED] IP: ${ip} exceeded limit on ${req.method} ${req.path}`);
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please slow down and try again later.',
          error: { code: 'RATE_LIMIT_EXCEEDED', resetInMs: ttl * 1000 }
        });
      }

      next();
    } catch (err) {
      logger.error('Redis Rate Limiter Error:', err.message);
      next(); // Don't block requests if rate limiting server experiences transient failures
    }
  };
};

module.exports = rateLimiter;
