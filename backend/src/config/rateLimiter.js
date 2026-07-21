const rateLimit = require('express-rate-limit');
const redisClient = require('./redis');

class FallbackStore {
  constructor(prefix) {
    this.prefix = prefix;
    this.useMemory = false;
  }

  async init(options) {
    this.options = options;
    const { MemoryStore } = require('express-rate-limit');
    this.memoryStore = new MemoryStore();
    if (typeof this.memoryStore.init === 'function') {
      await this.memoryStore.init(options);
    }

    if (redisClient.isOpen && redisClient.isReady) {
      try {
        const { RedisStore } = require('rate-limit-redis');
        this.redisStore = new RedisStore({
          sendCommand: async (...args) => {
            return await redisClient.sendCommand(args);
          },
          prefix: `rl:${this.prefix}:`
        });
        await this.redisStore.init(options);
      } catch (err) {
        console.warn(`Failed to initialize Redis store for rate limiting prefix "${this.prefix}", falling back to memory:`, err.message);
        this.useMemory = true;
      }
    } else {
      this.useMemory = true;
    }
  }

  async increment(key) {
    if (this.useMemory || !redisClient.isOpen || !redisClient.isReady) {
      return await this.memoryStore.increment(key);
    }
    try {
      return await this.redisStore.increment(key);
    } catch (err) {
      console.warn(`Redis rate limit store error for prefix "${this.prefix}", falling back to memory:`, err.message);
      this.useMemory = true;
      return await this.memoryStore.increment(key);
    }
  }

  async decrement(key) {
    if (this.useMemory || !redisClient.isOpen || !redisClient.isReady) {
      if (typeof this.memoryStore.decrement === 'function') {
        return await this.memoryStore.decrement(key);
      }
      return;
    }
    try {
      return await this.redisStore.decrement(key);
    } catch (err) {
      this.useMemory = true;
      if (typeof this.memoryStore.decrement === 'function') {
        return await this.memoryStore.decrement(key);
      }
    }
  }

  async resetKey(key) {
    if (this.useMemory || !redisClient.isOpen || !redisClient.isReady) {
      return await this.memoryStore.resetKey(key);
    }
    try {
      return await this.redisStore.resetKey(key);
    } catch (err) {
      this.useMemory = true;
      return await this.memoryStore.resetKey(key);
    }
  }
}

// Helper to create a store instance for each rate limiter
const createStore = (prefix) => {
  return new FallbackStore(prefix);
};


// Helper to construct standard rate limiter JSON error response
const createMessage = (message, code = 'TOO_MANY_REQUESTS') => ({
  success: false,
  message,
  error: { code }
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300, // Limit each IP to 300 requests per 15 minutes globally
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: createStore('global'),
  passOnStoreError: true,
  message: createMessage('Too many requests from this IP. Please try again after 15 minutes.')
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Increased from 15 to 100 for local development/testing
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: createStore('auth'),
  passOnStoreError: true,
  message: createMessage('Too many authentication attempts. Please try again after 15 minutes.', 'AUTH_BRUTE_FORCE')
});

// Strict limiter for OTP generation (send) — 30 sends per 5 minutes
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 30, // Increased from 5 to 30
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: createStore('otp'),
  passOnStoreError: true,
  message: createMessage('Too many OTP requests. Please wait 5 minutes before requesting again.', 'OTP_THROTTLED')
});

// More permissive limiter for OTP verification — 100 attempts per 5 minutes
const verifyOtpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 100, // Increased from 15 to 100
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: createStore('verify_otp'),
  passOnStoreError: true,
  message: createMessage('Too many verification attempts. Please wait a few minutes and try again.', 'OTP_THROTTLED')
});

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 60, // Limit each IP to 60 searches per minute
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: createStore('search'),
  passOnStoreError: true,
  message: createMessage('Too many search requests. Please slow down.', 'SEARCH_THROTTLED')
});

const scholarSyncLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 30, // Allow 30 syncs per 10 minutes (was 3 - users hitting limit)
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: createStore('scholar_sync'),
  passOnStoreError: true,
  message: createMessage('Too many sync requests. Please wait a moment and try again.', 'SYNC_THROTTLED')
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 50, // Limit each IP to 50 uploads per 15 minutes
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: createStore('upload'),
  passOnStoreError: true,
  message: createMessage('Too many file uploads from this IP. Please try again after 15 minutes.', 'UPLOAD_THROTTLED')
});

module.exports = {
  globalLimiter,
  authLimiter,
  otpLimiter,
  verifyOtpLimiter,
  searchLimiter,
  scholarSyncLimiter,
  uploadLimiter
};
