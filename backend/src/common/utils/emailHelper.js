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
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      family: 4
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
