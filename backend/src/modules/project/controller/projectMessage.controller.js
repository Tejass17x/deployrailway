const projectMessageService = require('../service/projectMessage.service');
const { successResponse } = require('../../../common/utils/response');
const asyncHandler = require('../../../common/middleware/asyncHandler');

const ProjectMessageController = {
  send: asyncHandler(async (req, res) => {
    const msg = await projectMessageService.sendMessage(req.params.projectId, req.user._id, req.body);
    return successResponse(res, 201, 'Message sent.', msg);
  }),

  list: asyncHandler(async (req, res) => {
    const messages = await projectMessageService.getMessages(req.params.projectId, req.query);
    return successResponse(res, 200, 'Messages fetched.', messages);
  }),

  getThread: asyncHandler(async (req, res) => {
    const thread = await projectMessageService.getThread(req.params.projectId, req.params.messageId);
    return successResponse(res, 200, 'Thread fetched.', thread);
  }),

  pinned: asyncHandler(async (req, res) => {
    const messages = await projectMessageService.getPinnedMessages(req.params.projectId);
    return successResponse(res, 200, 'Pinned messages.', messages);
  }),

  togglePin: asyncHandler(async (req, res) => {
    const msg = await projectMessageService.togglePin(req.params.messageId, req.user._id);
    return successResponse(res, 200, msg.isPinned ? 'Message pinned.' : 'Message unpinned.', msg);
  }),

  react: asyncHandler(async (req, res) => {
    const msg = await projectMessageService.addReaction(
      req.params.messageId, req.user._id, req.body.emoji
    );
    return successResponse(res, 200, 'Reaction updated.', msg);
  }),

  edit: asyncHandler(async (req, res) => {
    const msg = await projectMessageService.editMessage(
      req.params.messageId, req.user._id, req.body.content
    );
    return successResponse(res, 200, 'Message edited.', msg);
  }),

  delete: asyncHandler(async (req, res) => {
    const isAdmin = req.projectPermissions?.canManageAnnouncements;
    const msg = await projectMessageService.deleteMessage(req.params.messageId, req.user._id, isAdmin);
    return successResponse(res, 200, 'Message deleted.', msg);
  }),

  markRead: asyncHandler(async (req, res) => {
    await projectMessageService.markRead(req.params.messageId, req.user._id);
    return successResponse(res, 200, 'Marked as read.', null);
  }),
};

module.exports = ProjectMessageController;
