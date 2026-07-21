const logger = require('../../common/logger/winston');
const queue = require('../../common/queue/queue');
const { CONTACT_INFO } = require('./help.constants');
const {
  contactRequestRepository,
  grievanceRepository,
  feedbackRepository
} = require('./repository/help.repository');

class HelpService {
  /**
   * Creates a Contact Support Request
   */
  async createContactRequest(userId, data) {
    logger.info(`[HelpService] Creating Contact Request for user: ${userId}`);
    const contactRequest = await contactRequestRepository.create({
      userId,
      name: data.name,
      email: data.email.toLowerCase(),
      category: data.category,
      subject: data.subject,
      message: data.message,
      attachment: data.attachment || null,
      status: 'Pending'
    });

    // Enqueue confirmation email (async)
    this._sendConfirmationEmail(
      data.email,
      'Support Ticket Received - Research Connect',
      `Hi ${data.name},\n\nWe have received your support request regarding "${data.subject}". Our support team will get back to you within 24-48 business hours.\n\nTicket Details:\nCategory: ${data.category}\nMessage: ${data.message}\n\nBest regards,\nResearch Connect Support Team`
    ).catch(err => logger.error(`[HelpService] Failed to send contact confirmation: ${err.message}`));

    return contactRequest;
  }

  /**
   * Creates a Grievance Report
   */
  async createGrievance(userId, data) {
    logger.info(`[HelpService] Creating Grievance Report for user: ${userId}`);
    const grievance = await grievanceRepository.create({
      userId,
      name: data.name,
      email: data.email.toLowerCase(),
      category: data.category,
      paperUrl: data.paperUrl || null,
      description: data.description,
      attachment: data.attachment || null,
      status: 'Pending'
    });

    // Enqueue confirmation email (async)
    this._sendConfirmationEmail(
      data.email,
      'Grievance Submitted - Research Connect',
      `Hi ${data.name},\n\nYour grievance report regarding "${data.category}" has been successfully submitted and is now in Pending status. Our compliance team will review the details and take appropriate action.\n\nDescription:\n${data.description}\n\nBest regards,\nResearch Connect Compliance Team`
    ).catch(err => logger.error(`[HelpService] Failed to send grievance confirmation: ${err.message}`));

    return grievance;
  }

  /**
   * Creates a Feedback Submission
   */
  async createFeedback(userId, data) {
    logger.info(`[HelpService] Creating Feedback Submission for user: ${userId}`);
    const feedback = await feedbackRepository.create({
      userId,
      name: data.name || '',
      email: data.email ? data.email.toLowerCase() : '',
      rating: data.rating,
      category: data.category,
      comment: data.comment
    });

    return feedback;
  }

  /**
   * Returns Static Contact Info
   */
  async getContactInfo() {
    return CONTACT_INFO;
  }

  /**
   * Internal helper to enqueue email confirmations
   */
  async _sendConfirmationEmail(to, subject, textContent) {
    const jobData = {
      to,
      subject,
      text: textContent,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h2 style="color: #2563EB;">Research Connect</h2>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
              <p>${textContent.replace(/\n/g, '<br>')}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 12px; color: #666;">This is an automated message from Research Connect. Please do not reply directly to this email.</p>
             </div>`
    };

    await queue.enqueue('email', jobData);
    logger.info(`[HelpService] Enqueued email job to ${to} for subject: ${subject}`);
  }
}

module.exports = new HelpService();
