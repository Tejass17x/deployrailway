const projectAnnouncementRepository = require('../repository/projectAnnouncement.repository');
const activityLogRepository = require('../repository/projectActivityLog.repository');
const projectNotification = require('../helper/projectNotification.helper');
const { NotFoundError } = require('../../../common/errors/AppError');

const ProjectAnnouncementService = {
  async createAnnouncement(projectId, authorId, data) {
    const ann = await projectAnnouncementRepository.create({ ...data, projectId, authorId });
    await activityLogRepository.log({
      projectId, actorId: authorId, type: 'announcement_created',
      description: `Announcement "${ann.title}" posted`,
      resourceType: 'announcement', resourceId: ann._id,
    });
    // Notify all project members
    await projectNotification.notifyAllMembers(projectId, {
      type: 'project_announcement',
      actorId: authorId,
      resourceId: ann._id,
      message: `New announcement: "${ann.title}"`,
    });
    return ann;
  },

  async listAnnouncements(projectId, query) {
    return await projectAnnouncementRepository.findByProject(projectId, query);
  },

  async togglePin(announcementId, userId) {
    const ann = await projectAnnouncementRepository.togglePin(announcementId);
    if (!ann) throw new NotFoundError('Announcement not found.');
    await activityLogRepository.log({
      projectId: ann.projectId, actorId: userId,
      type: ann.isPinned ? 'announcement_pinned' : 'announcement_created',
      description: ann.isPinned ? `Announcement "${ann.title}" pinned` : `Announcement "${ann.title}" unpinned`,
    });
    return ann;
  },

  async markRead(announcementId, userId) {
    return await projectAnnouncementRepository.markRead(announcementId, userId);
  },

  async deleteAnnouncement(announcementId, userId) {
    const ann = await projectAnnouncementRepository.findById(announcementId);
    if (!ann) throw new NotFoundError('Announcement not found.');
    await projectAnnouncementRepository.softDelete(announcementId, userId);
    await activityLogRepository.log({
      projectId: ann.projectId, actorId: userId, type: 'announcement_deleted',
      description: `Announcement "${ann.title}" deleted`,
    });
    return { deleted: true };
  },
};

module.exports = ProjectAnnouncementService;
