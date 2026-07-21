const mongoose = require('mongoose');
const logger = require('../../common/logger/winston');
const dnsPromises = require('dns').promises;
const dns = require('dns');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error('MONGO_URI environment variable is required');
}

const options = {
  dbName: 'research_connect',
  maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE, 10) || 100,
  minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE, 10) || 10,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  serverSelectionTimeoutMS: 30000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true,
  writeConcern: { w: 'majority' }
};

let connectionPromise = null;
let retryCount = 0;

/**
 * Extract SRV record name from mongodb+srv connection string
 */
function getSrvRecordName(uri) {
  if (!uri.startsWith('mongodb+srv://')) return null;
  const match = uri.match(/@([^/?#]+)/);
  if (!match) return null;
  return `_mongodb._tcp.${match[1]}`;
}

/**
 * Perform a DNS SRV record lookup diagnostics report
 */
async function testSRVResolution(srvRecord) {
  const start = Date.now();
  try {
    const servers = dns.getServers();
    logger.info(`[DNS DIAGNOSTIC] Current active DNS servers: ${JSON.stringify(servers)}`);
    logger.info(`[DNS DIAGNOSTIC] Resolving SRV record: ${srvRecord}`);
    const results = await dnsPromises.resolveSrv(srvRecord);
    logger.info(`[DNS SUCCESS] Resolved SRV record in ${Date.now() - start}ms: ${JSON.stringify(results.slice(0, 2))}...`);
    return { success: true, results };
  } catch (err) {
    logger.error(`[DNS FAILURE] SRV resolution failed in ${Date.now() - start}ms: ${err.code || err.message}`);
    return { success: false, error: err };
  }
}

/**
 * Configurable DNS Resolution Strategy.
 * Resolves the querySrv REFUSED / DNS issues on Windows, Railway, and Docker container bridges.
 */
async function initializeDNSResolution(uri) {
  const srvRecord = getSrvRecordName(uri);
  if (!srvRecord) {
    logger.info('[DNS INIT] Not a mongodb+srv string. Skipping SRV DNS validation.');
    return;
  }

  const cacheDir = path.join(__dirname, 'temp');
  const cachePath = path.join(cacheDir, 'dns_cache.json');

  // Check if we have a valid cached DNS servers configuration
  if (fs.existsSync(cachePath)) {
    try {
      const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      const ageMs = Date.now() - (cacheData.timestamp || 0);
      if (ageMs < 86400000 && Array.isArray(cacheData.servers) && cacheData.servers.length > 0) {
        logger.info(`[DNS INIT] Applying cached DNS configuration: ${JSON.stringify(cacheData.servers)}`);
        dns.setServers(cacheData.servers);
        
        // Test cache
        const check = await testSRVResolution(srvRecord);
        if (check.success) {
          logger.info('[DNS INIT] DNS resolved successfully from cache. Skipping active DNS fallback search.');
          return;
        }
        logger.warn('[DNS INIT] Cached DNS resolution failed. Retrying active resolution.');
      }
    } catch (cacheErr) {
      logger.warn(`[DNS INIT] Failed reading DNS cache: ${cacheErr.message}`);
    }
  }

  // 1. Check if user configured explicit DNS servers via environment
  const configDns = process.env.DNS_SERVERS;
  if (configDns) {
    const targetServers = configDns.split(',').map(s => s.trim()).filter(Boolean);
    if (targetServers.length > 0) {
      logger.info(`[DNS INIT] Overriding DNS servers with custom configuration: ${JSON.stringify(targetServers)}`);
      try {
        dns.setServers(targetServers);
      } catch (err) {
        logger.error(`[DNS INIT] Failed to apply custom DNS servers: ${err.message}`);
      }
    }
  }

  // 2. Proactively test resolution
  let check = await testSRVResolution(srvRecord);
  let resolvedServers = dns.getServers();
  
  // 3. Fallback dynamically if resolution failed
  if (!check.success) {
    const fallbackServers = ['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4'];
    logger.warn(`[DNS INIT] System DNS failed to resolve MongoDB SRV. Applying public resolver fallback: ${JSON.stringify(fallbackServers)}`);
    try {
      dns.setServers(fallbackServers);
      // Re-test resolution with public servers
      check = await testSRVResolution(srvRecord);
      if (!check.success) {
        logger.error('[DNS ALERT] Resolved SRV query still failed after switching to public DNS. Database connection might fail if a firewall or local proxy intercepts DNS traffic.');
      } else {
        logger.info('[DNS INIT] Public DNS fallback successfully resolved the SRV record.');
        resolvedServers = fallbackServers;
      }
    } catch (err) {
      logger.error(`[DNS INIT] Failed to configure/test fallback DNS servers: ${err.message}`);
    }
  }

  // Save successful DNS servers configuration to cache
  if (check.success) {
    try {
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      fs.writeFileSync(cachePath, JSON.stringify({
        timestamp: Date.now(),
        servers: resolvedServers
      }), 'utf8');
      logger.info('[DNS INIT] Saved resolved DNS configuration to cache.');
    } catch (writeErr) {
      logger.error(`[DNS INIT] Failed writing DNS cache: ${writeErr.message}`);
    }
  }
}

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    try {
      // Check if system DNS can resolve SRV record, otherwise apply fallback
      await initializeDNSResolution(MONGO_URI);

      logger.info('Attempting to connect to MongoDB...');
      await mongoose.connect(MONGO_URI, options);
      retryCount = 0;
      
      // Asynchronously trigger database seeding check
      const { seedData } = require('./seeder');
      seedData().catch(err => logger.error('Seeder execution error:', err));

      return mongoose.connection;
    } catch (error) {
      retryCount++;
      const delay = Math.min(Math.pow(2, retryCount) * 1000, 30000);
      logger.error(`MongoDB connection failed (attempt ${retryCount}): ${error.message}`);
      logger.info(`Retrying in ${delay}ms...`);
      
      connectionPromise = null;
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectDB();
    }
  })();

  return connectionPromise;
};

mongoose.connection.on('connected', () => logger.info('MongoDB connected.'));
mongoose.connection.on('error', (err) => logger.error('MongoDB error:', err));
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected.');
  connectionPromise = null; // Clear cached connection promise on disconnect
});

const checkHealth = () => {
  const readyState = mongoose.connection.readyState;
  const isHealthy = readyState === 1;
  
  return {
    isHealthy,
    status: ['disconnected', 'connected', 'connecting', 'disconnecting', 'uninitialized'][readyState] || 'unknown',
    replicaSet: mongoose.connection.getClient()?.topology?.description?.setName || 'n/a'
  };
};

const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('MongoDB connection closed.');
  }
};

module.exports = {
  connectDB,
  checkHealth,
  closeDB
};
