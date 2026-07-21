const projectAnnouncementService = require('../service/projectAnnouncement.service');
const { successResponse } = require('../../../common/utils/response');
const asyncHandler = require('../../../common/middleware/asyncHandler');

const ProjectAnnouncementController = {
  create: asyncHandler(async (req, res) => {
    const ann = await projectAnnouncementService.createAnnouncement(
      req.params.projectId, req.user._id, req.body
    );
    return successResponse(res, 201, 'Announcement posted.', ann);
  }),

  list: asyncHandler(async (req, res) => {
    const result = await projectAnnouncementService.listAnnouncements(req.params.projectId, req.query);
    return successResponse(res, 200, 'Announcements.', result);
  }),

  togglePin: asyncHandler(async (req, res) => {
    const ann = await projectAnnouncementService.togglePin(req.params.announcementId, req.user._id);
    return successResponse(res, 200, ann.isPinned ? 'Announcement pinned.' : 'Announcement unpinned.', ann);
  }),

  markRead: asyncHandler(async (req, res) => {
    await projectAnnouncementService.markRead(req.params.announcementId, req.user._id);
    return successResponse(res, 200, 'Marked as read.', null);
  }),

  delete: asyncHandler(async (req, res) => {
    const result = await projectAnnouncementService.deleteAnnouncement(
      req.params.announcementId, req.user._id
    );
    return successResponse(res, 200, 'Announcement deleted.', result);
  }),
};

module.exports = ProjectAnnouncementController;
