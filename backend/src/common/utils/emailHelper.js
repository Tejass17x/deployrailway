const dns = require('dns');
// GLOBALLY FORCE IPv4 FOR NODE.JS v18+ TO FIX RAILWAY ENETUNREACH
dns.setDefaultResultOrder('ipv4first');

const nodemailer = require('nodemailer');
const logger = require('../logger/winston');

const sendEmail = async ({ to, subject, html, text }) => {
  logger.info(`Sending email to ${to} with subject "${subject}"...`);

  if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_USER) {
    logger.info('--- MOCK EMAIL ---');
    logger.info(`To: ${to}`);
    logger.info(`Subject: ${subject}`);
    logger.info(`Body (text): ${text}`);
    logger.info('-------------------');
    return { messageId: 'mock-id-' + Date.now() };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      // Force IPv4 using dns.resolve4 — queries ONLY A records, completely
      // bypassing the system getaddrinfo which returns unreachable IPv6
      // addresses on Railway's IPv6-native DNS (fd12::10).
      lookup: (hostname, options, callback) => {
        dns.resolve4(hostname, (err, addresses) => {
          if (err) {
            return callback(err);
          }
          if (!addresses || addresses.length === 0) {
            return callback(new Error(`No IPv4 address found for ${hostname}`));
          }
          // Pass the first explicit IPv4 address back to Nodemailer
          callback(null, addresses[0], 4);
        });
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"Research Connect" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
};

module.exports = {
  sendEmail
};
