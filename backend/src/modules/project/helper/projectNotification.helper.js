/**
 * Helper to send a standardized notification to project-related users.
 * Delegates to the existing notifications module.
 */
const sendNotification = async (recipientId, payload) => {
  try {
    const Notification = require('../../../models/Notification');
    const { getIO } = require('../../../config/socket');

    const notification = await Notification.create({
      recipientId: recipientId,
      actorId: payload.actorId,
      type: payload.type,
      title: payload.title || 'Project Update',
      message: payload.message,
      targetUrl: payload.link || `/projects/${payload.projectId}`,
      targetType: 'Project',
      targetId: payload.resourceId || payload.projectId,
    });

    // Real-time push
    try {
      const io = getIO();
      if (io) {
        io.to(`user:${recipientId}`).emit('notification:new', notification);
      }
    } catch (e) { /* socket not critical */ }

    return notification;
  } catch (err) {
    // Notifications are non-critical — log and continue
    const logger = require('../../../common/logger/winston');
    logger.error('ProjectNotification error:', err);
  }
};

const projectNotification = {
  /**
   * Notify the project owner.
   */
  async notifyOwner(project, payload) {
    const ownerId = project.owner?._id || project.owner;
    return await sendNotification(ownerId, { ...payload, projectId: project._id });
  },

  /**
   * Notify a specific user.
   */
  async notifyUser(userId, payload) {
    return await sendNotification(userId, payload);
  },

  /**
   * Notify a specific applicant.
   */
  async notifyApplicant(projectId, applicantId, payload) {
    return await sendNotification(applicantId, { ...payload, projectId });
  },

  /**
   * Notify all active project members.
   */
  async notifyAllMembers(projectId, payload) {
    try {
      const { ProjectMember } = require('../../../models/ProjectMember');
      const members = await ProjectMember.find({
        projectId,
        status: 'active',
        isDeleted: { $ne: true },
      }).select('userId').lean();

      await Promise.allSettled(
        members.map((m) =>
          sendNotification(m.userId, { ...payload, projectId })
        )
      );
    } catch (err) {
      const logger = require('../../../common/logger/winston');
      logger.error('Notify all members error:', err);
    }
  },

  /**
   * Notify project admins (owner + project-admin role).
   */
  async notifyAdmins(projectId, payload) {
    try {
      const { ProjectMember } = require('../../../models/ProjectMember');
      const admins = await ProjectMember.find({
        projectId,
        role: { $in: ['principal-investigator', 'project-admin'] },
        status: 'active',
        isDeleted: { $ne: true },
      }).select('userId').lean();

      await Promise.allSettled(
        admins.map((m) =>
          sendNotification(m.userId, { ...payload, projectId })
        )
      );
    } catch (err) {
      const logger = require('../../../common/logger/winston');
      logger.error('Notify admins error:', err);
    }
  },
};

module.exports = projectNotification;
