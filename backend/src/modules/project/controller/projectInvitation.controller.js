const projectInvitationService = require('../service/projectInvitation.service');
const { successResponse } = require('../../../common/utils/response');
const asyncHandler = require('../../../common/middleware/asyncHandler');

const ProjectInvitationController = {
  send: asyncHandler(async (req, res) => {
    const { userId, role, message } = req.body;
    const inv = await projectInvitationService.sendInvitation(
      req.params.projectId, req.user._id, userId, { role, message }
    );
    return successResponse(res, 201, 'Invitation sent.', inv);
  }),

  listInvitations: asyncHandler(async (req, res) => {
    const result = await projectInvitationService.listProjectInvitations(req.params.projectId, req.query);
    return successResponse(res, 200, 'Invitations fetched.', result);
  }),

  myInvitations: asyncHandler(async (req, res) => {
    const result = await projectInvitationService.myInvitations(req.user._id, req.query);
    return successResponse(res, 200, 'Your invitations.', result);
  }),

  accept: asyncHandler(async (req, res) => {
    const result = await projectInvitationService.acceptInvitation(req.params.invitationId, req.user._id);
    return successResponse(res, 200, 'Invitation accepted. You have joined the project.', result);
  }),

  reject: asyncHandler(async (req, res) => {
    const result = await projectInvitationService.rejectInvitation(
      req.params.invitationId, req.user._id, req.body.reason
    );
    return successResponse(res, 200, 'Invitation rejected.', result);
  }),

  cancel: asyncHandler(async (req, res) => {
    const result = await projectInvitationService.cancelInvitation(req.params.invitationId, req.user._id);
    return successResponse(res, 200, 'Invitation cancelled.', result);
  }),
};

module.exports = ProjectInvitationController;
