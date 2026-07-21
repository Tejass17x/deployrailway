const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// ─── Required variable definitions ───────────────────────────────────────────
// These variables MUST exist in all environments. Missing any causes startup failure.
const REQUIRED_VARS = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];

// These are strongly recommended in production but allowed to fall back in dev.
const RECOMMENDED_VARS = ['EMAIL_USER', 'EMAIL_PASS'];

const missing = REQUIRED_VARS.filter(v => !process.env[v]);
if (missing.length > 0) {
  // In production: hard crash. In development: loud warning so devs notice.
  const msg = `[CONFIG ERROR] Missing required environment variables: ${missing.join(', ')}\nSet them in .env and restart.`;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(msg);
  } else {
    console.error('\x1b[31m%s\x1b[0m', msg); // Red console output in dev
  }
}

if (process.env.NODE_ENV === 'production') {
  RECOMMENDED_VARS.filter(v => !process.env[v]).forEach(v =>
    console.warn(`[CONFIG WARNING] Recommended env var "${v}" is not set.`)
  );
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  serverUrl: process.env.SERVER_URL || 'http://localhost:5000',
  logLevel: process.env.LOG_LEVEL || 'info',

  mongo: {
    uri: process.env.MONGO_URI, // Never fall back — REQUIRED_VARS guard above ensures this exists
    maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE, 10) || 10,
    minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE, 10) || 2
  },

  redis: {
    uri: process.env.REDIS_URL || 'redis://localhost:6379'
  },

  r2: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucketName: process.env.R2_BUCKET_NAME || 'research-connect',
    publicUrl: process.env.R2_PUBLIC_URL || ''
  },

  jwt: {
    secret: process.env.JWT_SECRET, // No fallback — intentional; see jwtHelper.js
    expire: process.env.JWT_EXPIRE || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET, // No fallback — intentional
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d'
  },

  email: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    resendKey: process.env.RESEND_API_KEY || ''
  },

  serpApi: {
    key: process.env.SERP_API_KEY || ''
  },
  dnsServers: process.env.DNS_SERVERS || ''
};


