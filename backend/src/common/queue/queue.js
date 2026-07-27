const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const logger = require('../logger/winston');

// Redis URL fallback to localhost
const rawUri = process.env.REDIS_URL || 'redis://localhost:6379';

// Upstash requires TLS for all connections, even on redis:// scheme.
const isUpstash = rawUri.includes('upstash.io');
const useTls = isUpstash || process.env.REDIS_TLS === 'true';

// Force rediss:// protocol if TLS is required and the URL uses redis://
let REDIS_URI;
if (useTls && rawUri.startsWith('redis://')) {
  REDIS_URI = rawUri.replace(/^redis:\/\//, 'rediss://');
  logger.info(`[BULLMQ] TLS enabled — forcing rediss:// protocol for connection.`);
} else {
  REDIS_URI = rawUri;
}

// ioredis connection instance with graceful fallback
let connection = null;
let redisAvailable = false;

// Keep track of retries across restarts
let redisRetryCount = 0;

try {
  const options = {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableOfflineQueue: false, // Don't queue commands when disconnected
    // Fail fast — don't hang indefinitely on connection attempts
    connectTimeout: 5000,
    // TLS is auto-detected from the rediss:// scheme
    tls: useTls ? {} : undefined,
    retryStrategy: (times) => {
      // Allow up to 5 retries with exponential backoff, then stop
      if (redisRetryCount >= 5) {
        logger.warn('[BULLMQ] Redis unavailable after 5 retries. Queue jobs will be processed inline.');
        return null; // Stop reconnecting
      }
      redisRetryCount = times;
      return Math.min(Math.pow(2, times) * 1000, 10000);
    }
  };
  connection = new IORedis(REDIS_URI, options);

  connection.on('connect', () => {
    redisAvailable = true;
    logger.info('[BULLMQ] Redis connected for queue management.');
  });

  connection.on('error', (err) => {
    if (redisAvailable) {
      redisAvailable = false;
      logger.warn('[BULLMQ] Redis unavailable. Queue jobs will be processed inline.');
    }
  });

  connection.on('close', () => {
    redisAvailable = false;
  });
} catch (err) {
  logger.warn('[BULLMQ] Redis not available. Queue jobs will be processed inline.');
}

const queues = {};
const workers = {};

class BullMQAdapter {
  /**
   * Enqueue a job to BullMQ
   */
  async enqueue(queueName, jobData) {
    if (!redisAvailable || !connection) {
      logger.warn(`[BULLMQ] Redis unavailable. Skipping queue job for ${queueName}.`);
      return null;
    }

    try {
      if (!queues[queueName]) {
        queues[queueName] = new Queue(queueName, {
          connection,
          defaultJobOptions: {
            attempts: 5,
            backoff: {
              type: 'exponential',
              delay: 2000
            },
            removeOnComplete: true,
            removeOnFail: false
          }
        });
      }

      // Wrap enqueue in a timeout so a degraded Redis doesn't hang the request
      const job = await Promise.race([
        queues[queueName].add('job', jobData),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Queue enqueue timeout')), 3000)
        )
      ]);
      logger.info(`[BULLMQ] Job ${job.id} successfully enqueued to ${queueName}`);
      return job.id;
    } catch (err) {
      logger.warn(`[BULLMQ] Redis unavailable for ${queueName}. Job skipped.`);
      return null;
    }
  }

  /**
   * Register and start a background worker loop for a queue
   */
  process(queueName, handler) {
    if (workers[queueName]) {
      logger.warn(`[BULLMQ] Worker for queue ${queueName} already registered.`);
      return;
    }

    if (!redisAvailable || !connection) {
      logger.warn(`[BULLMQ] Redis unavailable. Worker for ${queueName} not started.`);
      return;
    }

    logger.info(`[BULLMQ] Starting Worker loop for queue: ${queueName}`);

    const worker = new Worker(queueName, async (job) => {
      // Execute the original handler passing job data
      return handler(job.data);
    }, {
      connection,
      concurrency: 10 // process up to 10 jobs concurrently
    });

    worker.on('completed', (job) => {
      logger.info(`[BULLMQ SUCCESS] Job ${job.id} in queue ${queueName} completed.`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`[BULLMQ FAILED] Job ${job?.id} in queue ${queueName} failed with error: ${err.message}`);
    });

    workers[queueName] = worker;
  }
}

module.exports = new BullMQAdapter();