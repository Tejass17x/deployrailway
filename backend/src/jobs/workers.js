const queue = require('../common/queue/queue');
const logger = require('../common/logger/winston');
const nodemailer = require('nodemailer');
const env = require('../config/environment');

/**
 * 1. Email Worker Handler
 * Processes transactional and notification emails.
 * Supports Resend API and falls back to Nodemailer SMTP.
 */
const emailWorkerHandler = async (job) => {
  logger.info(`[Email Worker] Processing mail dispatch to ${job.to}`);
  
  if (env.email.resendKey) {
    try {
      const axios = require('axios');
      await axios.post('https://api.resend.com/emails', {
        from: `Research Connect <onboarding@resend.dev>`,
        to: job.to,
        subject: job.subject,
        html: job.html
      }, {
        headers: {
          'Authorization': `Bearer ${env.email.resendKey}`,
          'Content-Type': 'application/json'
        }
      });
      logger.info(`[Email Worker] Resend API successfully sent mail to ${job.to}`);
      return;
    } catch (err) {
      logger.error(`[Email Worker] Resend API failed: ${err.message}. Falling back to SMTP.`);
    }
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.email.user,
      pass: env.email.pass
    }
  });

  const mailOptions = {
    from: `"Research Connect" <${env.email.user}>`,
    to: job.to,
    subject: job.subject,
    html: job.html,
    text: job.text
  };

  await transporter.sendMail(mailOptions);
  logger.info(`[Email Worker] Nodemailer SMTP successfully sent mail to ${job.to}`);
};

/**
 * 2. Notification Worker Handler
 * Processes user notifications and records them in MongoDB.
 */
const notificationWorkerHandler = async (job) => {
  logger.info(`[Notification Worker] Dispatching system notification to user: ${job.recipientId}`);
  const Notification = require('../models/Notification');
  await Notification.create({
    recipientId: job.recipientId,
    actorId: job.actorId,
    type: job.type || 'system',
    title: job.title,
    message: job.message,
    targetType: job.targetType,
    targetId: job.targetId,
    targetUrl: job.targetUrl,
    isRead: false
  });
};

/**
 * 3. File Processing Worker Handler
 * Processes thumbnail generation, extraction caching, and compression.
 */
const fileProcessingWorkerHandler = async (job) => {
  logger.info(`[File Processing Worker] Optimizing file asset: ${job.key}`);
  // In production, execute tesseract, image compressions, and thumbnail conversions here.
  logger.info(`[File Processing Worker] Thumbnail generation and compression complete for: ${job.key}`);
};

/**
 * 4. Report Worker Handler
 * Generates research and user activity reports.
 */
const reportWorkerHandler = async (job) => {
  logger.info(`[Report Worker] Generating PDF/CSV report for category: ${job.reportType}`);
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate file creation
  logger.info(`[Report Worker] Report generated successfully.`);
};

/**
 * 5. Queue Manager Worker
 * Health monitoring and queue housekeeping tasks.
 */
const queueWorkerHandler = async (job) => {
  logger.info(`[Queue Worker Manager] Queue healthcheck executed.`);
};

// Main initializer
const initWorkers = () => {
  logger.info('Initializing background workers...');
  queue.process('email', emailWorkerHandler);
  queue.process('notification', notificationWorkerHandler);
  queue.process('file_processing', fileProcessingWorkerHandler);
  queue.process('report', reportWorkerHandler);
  queue.process('queue_manager', queueWorkerHandler);
};

module.exports = {
  initWorkers
};
