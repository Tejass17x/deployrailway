const importRepository = require('../repository/import.repository');
const importLogRepository = require('../repository/import-log.repository');
const logger = require('../../../common/logger/winston');

class ImportQueueService {
  constructor() {
    this.isProcessing = false;
    this.workerInterval = null;
    // We defer importing scholarService to avoid circular dependency
    this.scholarService = null;
  }

  // Set the scholar service reference
  setScholarService(scholarService) {
    this.scholarService = scholarService;
  }

  /**
   * Log message to the database import logs collection
   */
  async log(importId, userId, message, level = 'info') {
    logger.info(`[ImportJob:${importId}] [${level.toUpperCase()}] ${message}`);
    try {
      await importLogRepository.create({
        importId,
        userId,
        level,
        message,
        timestamp: new Date()
      });
    } catch (err) {
      logger.error(`Failed to write import log: ${err.message}`);
    }
  }

  /**
   * Find active import job for a user, with stale job timeout check
   */
  async findActiveImportByUserId(userId, provider = 'google_scholar') {
    const activeJob = await importRepository.model.findOne({
      userId,
      provider,
      status: { $in: ['pending', 'running'] }
    }).sort({ createdAt: -1 });

    if (!activeJob) return null;

    // If job has been pending or running for more than 5 minutes, mark it failed so a new one can start
    const maxWaitMs = 5 * 60 * 1000;
    const elapsed = Date.now() - new Date(activeJob.updatedAt || activeJob.createdAt).getTime();
    if (elapsed > maxWaitMs) {
      logger.warn(`[ImportQueue] Stale job ${activeJob._id} found (${Math.round(elapsed/1000)}s old). Resetting to allow new sync.`);
      await importRepository.model.updateOne(
        { _id: activeJob._id },
        { $set: { status: 'failed', error: { message: 'Timed out - replaced by new sync' } } }
      );
      return null;
    }

    return activeJob;
  }

  /**
   * Enqueue a new import job
   */
  async enqueue(userId, provider = 'google_scholar', metadata = {}) {
    // If there is already an active job (pending or running), return it
    const activeJob = await this.findActiveImportByUserId(userId, provider);
    if (activeJob) {
      logger.info(`Job already active for user ${userId}, provider ${provider}`);
      return activeJob;
    }

    const job = await importRepository.create({
      userId,
      provider,
      status: 'pending',
      progress: 0,
      retryCount: 0,
      metadata
    });

    await this.log(job._id, userId, `Enqueued import job for provider: ${provider}`);
    
    // Trigger via RedisQueue
    try {
      const queue = require('../../../common/queue/queue');
      await queue.enqueue('scholar_import', { jobId: job._id, userId, authorId: metadata.authorId });
    } catch (queueErr) {
      logger.error(`Failed to enqueue in RedisQueue, falling back: ${queueErr.message}`);
      // Fallback: trigger worker processing inline asynchronously
      setImmediate(() => this.processNextJob());
    }

    return job;
  }

  /**
   * Core worker fallback: picks the next pending job atomically and processes it
   */
  async processNextJob() {
    try {
      // Find next pending job and atomically update it to 'running'
      const job = await importRepository.model.findOneAndUpdate(
        { status: 'pending' },
        { 
          $set: { 
            status: 'running', 
            lastAttemptAt: new Date() 
          } 
        },
        { new: true, sort: { createdAt: 1 } }
      );

      if (!job) {
        return;
      }

      await this.log(job._id, job.userId, `Started processing job for user: ${job.userId}. Attempt: ${job.retryCount + 1}`);

      try {
        if (!this.scholarService) {
          this.scholarService = require('./scholar.service');
        }

        // Run the actual import logic with a 10-minute total timeout
        const SYNC_TIMEOUT_MS = 10 * 60 * 1000;
        await Promise.race([
          this.scholarService.syncScholarData(job._id, job.userId, job.metadata?.authorId),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Sync timed out after " + SYNC_TIMEOUT_MS/1000 + "s")), SYNC_TIMEOUT_MS)
          )
        ]);
        // Update job to completed
        job.status = 'completed';
        job.progress = 100;
        job.completedAt = new Date();
        await job.save();

        await this.log(job._id, job.userId, 'Import job completed successfully!', 'info');
      } catch (err) {
        logger.error(`Error processing import job ${job._id}: ${err.message}`, err);
        await this.log(job._id, job.userId, `Job failed: ${err.message} \n ${err.stack}`, 'error');

        // Increment retry count
        job.retryCount += 1;
        job.error = { message: err.message, stack: err.stack };

        if (job.retryCount >= 3) {
          job.status = 'failed';
          await this.log(job._id, job.userId, 'Max retries exceeded. Job marked as failed.', 'error');
        } else {
          job.status = 'pending'; // Re-enqueue for retry
          await this.log(job._id, job.userId, `Re-enqueued job for retry attempt ${job.retryCount + 1}`, 'warn');
        }
        
        await job.save();
      }

    } catch (err) {
      logger.error(`Queue worker execution error: ${err.message}`);
    }
  }


  /**
   * Resume/cleanup interrupted jobs on startup (running/resume -> pending)
   */
  async resumeInterruptedJobs() {
    try {
      const interrupted = await importRepository.model.updateMany(
        { status: { $in: ['running', 'resume'] } },
        { 
          $set: { 
            status: 'pending',
            progress: 0
          } 
        }
      );
      if (interrupted.modifiedCount > 0) {
        logger.info(`Resumed ${interrupted.modifiedCount} interrupted Scholar import jobs.`);
      }
    } catch (err) {
      logger.error(`Error resuming interrupted jobs: ${err.message}`);
    }
  }

  /**
   * Start the background queue worker process
   */
  runQueueWorker() {
    if (this.workerInterval) return;

    logger.info('Initializing background Scholar import queue worker...');
    
    // Check and resume interrupted jobs on startup
    this.resumeInterruptedJobs().then(() => {
      const queue = require('../../../common/queue/queue');
      queue.process('scholar_import', async (jobData) => {
        const { jobId, userId, authorId } = jobData;
        const job = await importRepository.findById(jobId);
        if (!job || job.status === 'completed' || job.status === 'failed') {
          return;
        }

        // Atomically set running
        job.status = 'running';
        job.lastAttemptAt = new Date();
        await job.save();

        await this.log(job._id, userId, `Started processing job via RedisQueue. Attempt: ${job.retryCount + 1}`);

        try {
          if (!this.scholarService) {
            this.scholarService = require('./scholar.service');
          }

          // Run the actual import logic
          await this.scholarService.syncScholarData(job._id, userId, authorId);
          job.status = 'completed';
          job.progress = 100;
          job.completedAt = new Date();
          await job.save();

          await this.log(job._id, userId, 'Import job completed successfully!', 'info');
        } catch (err) {
          logger.error(`Error processing import job ${job._id}: ${err.message}`, err);
          await this.log(job._id, userId, `Job failed: ${err.message} \n ${err.stack}`, 'error');

          // Increment retry count
          job.retryCount += 1;
          job.error = { message: err.message, stack: err.stack };

          if (job.retryCount >= 3) {
            job.status = 'failed';
            await this.log(job._id, userId, 'Max retries exceeded. Job marked as failed.', 'error');
          } else {
            job.status = 'pending'; // Re-enqueue for retry
            await this.log(job._id, userId, `Re-enqueued job for retry attempt ${job.retryCount + 1}`, 'warn');
            // Re-enqueue in RedisQueue
            await queue.enqueue('scholar_import', jobData);
          }
          
          await job.save();
        }
      });
    });

    this.workerInterval = true;
  }

  /**
   * Stop worker (for tests/shutdown)
   */
  stopQueueWorker() {
    this.workerInterval = null;
  }
}

module.exports = new ImportQueueService();
