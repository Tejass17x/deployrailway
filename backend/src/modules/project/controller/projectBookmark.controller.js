const projectBookmarkService = require('../service/projectBookmark.service');
const { successResponse } = require('../../../common/utils/response');
const asyncHandler = require('../../../common/middleware/asyncHandler');

const ProjectBookmarkController = {
  toggle: asyncHandler(async (req, res) => {
    const type = req.body.type || 'bookmark';
    const result = await projectBookmarkService.toggle(req.params.id, req.user._id, type);
    return successResponse(res, 200, `Project ${result.action} as ${type}.`, result);
  }),

  myBookmarks: asyncHandler(async (req, res) => {
    const type = req.query.type || 'bookmark';
    const result = await projectBookmarkService.myBookmarks(req.user._id, type, req.query);
    return successResponse(res, 200, 'Your bookmarks.', result);
  }),

  checkStatus: asyncHandler(async (req, res) => {
    const status = await projectBookmarkService.checkStatus(req.params.id, req.user._id);
    return successResponse(res, 200, 'Bookmark status.', status);
  }),
};

module.exports = ProjectBookmarkController;
