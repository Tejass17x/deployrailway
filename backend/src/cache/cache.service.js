const redisClient = require('../config/redis');

// ─── Timeout Wrapper ─────────────────────────────────────────────────────────
// Wraps a promise with a timeout so that if Redis hangs, the operation
// fails fast instead of blocking the request indefinitely.
const withTimeout = async (promise, ms = 3000, operation = 'cache operation') => {
  return await Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout during ${operation}`)), ms)
    )
  ]);
};

class CacheService {
  constructor() {
    this.cache = new Map();
    this.redisClient = redisClient;
  }

  async get(key) {
    if (this.redisClient && this.redisClient.isOpen && this.redisClient.isReady) {
      try {
        const val = await withTimeout(this.redisClient.get(key), 3000, 'cache get');
        return val ? JSON.parse(val) : null;
      } catch (err) {
        console.error('Redis cache get error:', err);
      }
    }
    const item = this.cache.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value, ttlSeconds = 300) {
    if (this.redisClient && this.redisClient.isOpen && this.redisClient.isReady) {
      try {
        await withTimeout(this.redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds }), 3000, 'cache set');
        return true;
      } catch (err) {
        console.error('Redis cache set error:', err);
      }
    }
    const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null;
    this.cache.set(key, { value, expiry });
    return true;
  }

  async del(key) {
    if (this.redisClient && this.redisClient.isOpen && this.redisClient.isReady) {
      try {
        await withTimeout(this.redisClient.del(key), 3000, 'cache del');
        return true;
      } catch (err) {
        console.error('Redis cache del error:', err);
      }
    }
    return this.cache.delete(key);
  }

  async flush() {
    if (this.redisClient && this.redisClient.isOpen && this.redisClient.isReady) {
      try {
        await withTimeout(this.redisClient.flushAll(), 3000, 'cache flush');
        return true;
      } catch (err) {
        console.error('Redis cache flush error:', err);
      }
    }
    this.cache.clear();
    return true;
  }

  async delPattern(pattern) {
    if (this.redisClient && this.redisClient.isOpen && this.redisClient.isReady) {
      try {
        let cursor = '0';
        do {
          const reply = await withTimeout(this.redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 }), 3000, 'cache scan');
          cursor = reply.cursor;
          const keys = reply.keys || [];
          if (keys.length > 0) {
            await withTimeout(this.redisClient.del(keys), 3000, 'cache del pattern');
          }
        } while (cursor !== '0' && cursor !== 0);
        return true;
      } catch (err) {
        console.error(`Redis cache delPattern error for ${pattern}:`, err);
      }
    }
    // Memory fallback
    for (const key of this.cache.keys()) {
      const matchRegex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (matchRegex.test(key)) {
        this.cache.delete(key);
      }
    }
    return true;
  }
}

const cacheInstance = new CacheService();

// Domain caches
const ScholarCache = {
  get: async (userId) => cacheInstance.get(`scholar:${userId}`),
  set: async (userId, data, ttl = 1800) => cacheInstance.set(`scholar:${userId}`, data, ttl),
  del: async (userId) => cacheInstance.del(`scholar:${userId}`)
};

const ProfileCache = {
  get: async (userId) => cacheInstance.get(`profile:${userId}`),
  set: async (userId, data, ttl = 600) => cacheInstance.set(`profile:${userId}`, data, ttl),
  del: async (userId) => cacheInstance.del(`profile:${userId}`)
};

const FeedCache = {
  get: async (key) => cacheInstance.get(`feed:${key}`),
  set: async (key, data, ttl = 300) => cacheInstance.set(`feed:${key}`, data, ttl),
  del: async (key) => cacheInstance.del(`feed:${key}`),
  flush: async () => cacheInstance.delPattern('feed:*')
};

const PublicationCache = {
  get: async (slugOrId) => cacheInstance.get(`pub:${slugOrId}`),
  set: async (slugOrId, data, ttl = 900) => cacheInstance.set(`pub:${slugOrId}`, data, ttl),
  del: async (slugOrId) => cacheInstance.del(`pub:${slugOrId}`)
};

const AIPromptCache = {
  get: async (key) => cacheInstance.get(`ai:prompt:${key}`),
  set: async (key, data, ttl = 3600) => cacheInstance.set(`ai:prompt:${key}`, data, ttl),
  del: async (key) => cacheInstance.del(`ai:prompt:${key}`)
};

// Cache for lookup collections (Country, Institution, Department)
const LookupCache = {
  getCountries: async () => cacheInstance.get('lookup:countries'),
  setCountries: async (data) => cacheInstance.set('lookup:countries', data, 86400), // 24h
  getInstitutions: async (country) => cacheInstance.get(`lookup:institutions:${country || 'all'}`),
  setInstitutions: async (data, country) => cacheInstance.set(`lookup:institutions:${country || 'all'}`, data, 86400),
  invalidate: async () => {
    await cacheInstance.del('lookup:countries');
    await cacheInstance.del('lookup:institutions:all');
  }
};

// Cache for platform-wide statistics (landing page)
const PlatformStatsCache = {
  get: async () => cacheInstance.get('platform:stats'),
  set: async (data) => cacheInstance.set('platform:stats', data, 3600), // 1h
  del: async () => cacheInstance.del('platform:stats')
};

const ProjectCache = {
  get: async (idOrSlug) => cacheInstance.get(`project:${idOrSlug}`),
  set: async (idOrSlug, data, ttl = 300) => cacheInstance.set(`project:${idOrSlug}`, data, ttl),
  del: async (idOrSlug) => cacheInstance.del(`project:${idOrSlug}`)
};

module.exports = {
  cacheService: cacheInstance,
  ScholarCache,
  ProfileCache,
  FeedCache,
  PublicationCache,
  AIPromptCache,
  LookupCache,
  PlatformStatsCache,
  ProjectCache
};