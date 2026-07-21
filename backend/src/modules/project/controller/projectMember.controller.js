const projectMemberService = require('../service/projectMember.service');
const { successResponse } = require('../../../common/utils/response');
const asyncHandler = require('../../../common/middleware/asyncHandler');

const ProjectMemberController = {
  list: asyncHandler(async (req, res) => {
    const result = await projectMemberService.listMembers(req.params.projectId, req.query);
    return successResponse(res, 200, 'Members fetched.', result);
  }),

  assignRole: asyncHandler(async (req, res) => {
    const { userId, role } = req.body;
    const result = await projectMemberService.assignRole(
      req.params.projectId, req.user._id, userId, role
    );
    return successResponse(res, 200, 'Role assigned.', result);
  }),

  updatePermissions: asyncHandler(async (req, res) => {
    const { userId, permissions } = req.body;
    const result = await projectMemberService.updatePermissions(
      req.params.projectId, req.user._id, userId, permissions
    );
    return successResponse(res, 200, 'Permissions updated.', result);
  }),

  remove: asyncHandler(async (req, res) => {
    const result = await projectMemberService.removeMember(
      req.params.projectId, req.user._id, req.params.memberId
    );
    return successResponse(res, 200, 'Member removed.', result);
  }),

  leave: asyncHandler(async (req, res) => {
    const result = await projectMemberService.leaveProject(req.params.projectId, req.user._id);
    return successResponse(res, 200, 'You have left the project.', result);
  }),

  suspend: asyncHandler(async (req, res) => {
    const { userId, reason } = req.body;
    const result = await projectMemberService.suspendMember(
      req.params.projectId, req.user._id, userId, reason
    );
    return successResponse(res, 200, 'Member suspended.', result);
  }),

  reinstate: asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const result = await projectMemberService.reinstateMember(
      req.params.projectId, req.user._id, userId
    );
    return successResponse(res, 200, 'Member reinstated.', result);
  }),

  transferOwnership: asyncHandler(async (req, res) => {
    const { newOwnerId } = req.body;
    const result = await projectMemberService.transferOwnership(
      req.params.projectId, req.user._id, newOwnerId
    );
    return successResponse(res, 200, 'Ownership transferred.', result);
  }),

  getMyPermissions: asyncHandler(async (req, res) => {
    const data = await projectMemberService.getMemberWithPermissions(
      req.params.projectId, req.user._id
    );
    return successResponse(res, 200, 'Your permissions.', data);
  }),
};

module.exports = ProjectMemberController;
