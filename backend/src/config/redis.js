const { createClient } = require('redis');
const logger = require('../common/logger/winston');

// Use REDIS_URL to fetch from .env, fallback to localhost if missing
const REDIS_URI = process.env.REDIS_URL || 'redis://localhost:6379';

const isRedisConnError = (err) => {
  if (!err) return false;
  const msg = err.message || '';
  const name = err.name || '';
  const stack = err.stack || '';
  
  return (
    msg.includes('max requests limit exceeded') ||
    msg.includes('TimeoutError') ||
    name === 'TimeoutError' ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ECONNRESET') ||
    msg.includes('socket') ||
    msg.includes('closed') ||
    msg.includes('Connection lost') ||
    name === 'AggregateError' ||
    stack.includes('ECONNREFUSED') ||
    (err.errors && err.errors.some(e => {
      const emsg = e.message || '';
      return emsg.includes('ECONNREFUSED') || emsg.includes('ETIMEDOUT');
    }))
  );
};

const redisClient = createClient({
  url: REDIS_URI,
  socket: {
    reconnectStrategy: (retries) => {
      // Stop retrying immediately if Redis is not available
      if (isLimitExceeded || retries > 0) {
        return false;
      }
      return 1000;
    }
  }
});

let isLimitExceeded = false;

redisClient.on('error', (err) => {
  if (isRedisConnError(err)) {
    if (!isLimitExceeded) {
      isLimitExceeded = true;
      logger.warn('[REDIS] Redis not available. Running without Redis (in-memory mode).');
    }
  } else {
    if (!isLimitExceeded) {
      logger.error('[REDIS CLIENT ERROR]', err);
    }
  }
});

redisClient.on('connect', () => {
  logger.info('Redis client initiating connection...');
});

redisClient.on('ready', () => {
  logger.info('Redis client connected and ready.');
});

// Proxy client to intercept properties and commands, providing seamless fallback
const clientProxy = new Proxy(redisClient, {
  get(target, prop, receiver) {
    if (prop === 'isLimitExceeded') {
      return isLimitExceeded;
    }
    if (prop === 'setIsLimitExceeded') {
      return (val) => { isLimitExceeded = val; };
    }
    if (prop === 'isOpen') {
      return isLimitExceeded ? false : target.isOpen;
    }
    if (prop === 'isReady') {
      return isLimitExceeded ? false : target.isReady;
    }

    const value = Reflect.get(target, prop, receiver);

    if (typeof value === 'function') {
      return function (...args) {
        if (isLimitExceeded && prop !== 'connect' && prop !== 'disconnect' && prop !== 'quit' && prop !== 'on') {
          throw new Error('Redis client is offline due to rate limit exhaustion');
        }

        if (prop === 'connect') {
          return (async () => {
            try {
              const res = await value.apply(target, args);
              // Run a test command to verify if Upstash is over quota or timing out
              try {
                await Promise.race([
                  target.get('__test_rate_limit__'),
                  new Promise((_, reject) => setTimeout(() => reject(new Error('TimeoutError')), 2000))
                ]);
              } catch (pingErr) {
                if (isRedisConnError(pingErr)) {
                  isLimitExceeded = true;
                  logger.warn('[REDIS] Redis rate limit or timeout during connection test. Falling back to in-memory mode.');
                }
              }
              return res;
            } catch (err) {
              if (isRedisConnError(err)) {
                isLimitExceeded = true;
                logger.warn('[REDIS] Redis rate limit or timeout during connect. Falling back to in-memory mode.');
              }
              throw err;
            }
          })();
        }

        try {
          const result = value.apply(target, args);
          if (result instanceof Promise) {
            return result.catch((err) => {
              if (isRedisConnError(err)) {
                if (!isLimitExceeded) {
                  isLimitExceeded = true;
                  logger.warn('[REDIS] Redis rate limit or timeout detected. Falling back to in-memory mode.');
                }
                throw new Error('Redis client is offline due to rate limit exhaustion');
              }
              throw err;
            });
          }
          return result;
        } catch (err) {
          if (isRedisConnError(err)) {
            if (!isLimitExceeded) {
              isLimitExceeded = true;
              logger.warn('[REDIS] Redis rate limit or timeout detected. Falling back to in-memory mode.');
            }
            throw new Error('Redis client is offline due to rate limit exhaustion');
          }
          throw err;
        }
      };
    }

    return value;
  }
});

module.exports = clientProxy;