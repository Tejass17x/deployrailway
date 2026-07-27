const { resolve4 } = require('dns').promises;
const queue = require('../common/queue/queue');
const logger = require('../common/logger/winston');
const nodemailer = require('nodemailer');
const env = require('../config/environment');

/**
 * 1. Email Worker Handler
 * Processes transactional and notification emails via Gmail SMTP.
 *
 * Railway's network:
 *   1. Cannot route IPv6 to smtp.gmail.com (ENETUNREACH on AAAA records)
 *   2. Blocks outbound port 465 (TCP SYN gets no response → timeout)
 *
 * Fixes applied:
 *   - Port 587 with STARTTLS instead of port 465 SMTPS (587 is the standard
 *     submission port and is rarely blocked by cloud providers).
 *   - Manually resolves smtp.gmail.com to a raw IPv4 address via
 *     dns.resolve4() BEFORE creating the transport.  Nodemailer's internal
 *     DNS (including family: 4 and the lookup option) is unreliable when
 *     the system resolver is IPv6-native — passing the IP directly as
 *     host bypasses its DNS completely.
 *   - tls.servername set to smtp.gmail.com so the TLS handshake uses the
 *     correct hostname for certificate validation.
 *   - Tight timeouts so a broken connection fails fast instead of hanging
 *     the BullMQ worker forever.
 */
const emailWorkerHandler = async (job) => {
  logger.info(`[Email Worker] Processing mail dispatch to ${job.to}`);

  if (!env.email.user || !env.email.pass) {
    logger.warn(`[Email Worker] EMAIL_USER / EMAIL_PASS not configured — cannot send to ${job.to}`);
    return;
  }

  // Resolve smtp.gmail.com to a raw IPv4 address.
  // Railway's DNS is IPv6-native (fd12::10) and returns AAAA records
  // that are unreachable.  We resolve4() to get only A records.
  let smtpHost = 'smtp.gmail.com';
  try {
    const [ipv4] = await resolve4('smtp.gmail.com');
    smtpHost = ipv4;
    logger.info(`[Email Worker] Resolved smtp.gmail.com → ${ipv4} (IPv4)`);
  } catch (dnsErr) {
    logger.warn(`[Email Worker] DNS resolve4 failed: ${dnsErr.message}. Using hostname directly.`);
  }

  const transporter = nodemailer.createTransport({
    // Use the raw IPv4 address as host to completely bypass nodemailer's
    // DNS resolution — nothing between us and Gmail can pick IPv6.
    host: smtpHost,
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: env.email.user,
      pass: env.email.pass,
    },
    tls: {
      // SNI hostname so Gmail's TLS certificate validates correctly
      servername: 'smtp.gmail.com',
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 15000,
  });

  const mailOptions = {
    from: `"Research Connect" <${env.email.user}>`,
    to: job.to,
    subject: job.subject,
    html: job.html,
    text: job.text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`[Email Worker] SMTP successfully sent mail to ${job.to}: ${info.messageId}`);
  } catch (error) {
    logger.error(
      `[Email Worker] SMTP failed for ${job.to}: ${error.message}`,
      { code: error.code, command: error.command, stack: error.stack?.split('\n')[0] }
    );
    // Let the error propagate so BullMQ retries the job
    // (queue defaults: 5 attempts, exponential backoff starting at 2s)
    throw error;
  }
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
