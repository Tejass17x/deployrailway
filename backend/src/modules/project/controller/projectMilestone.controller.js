const projectMilestoneService = require('../service/projectMilestone.service');
const { successResponse } = require('../../../common/utils/response');
const asyncHandler = require('../../../common/middleware/asyncHandler');

const ProjectMilestoneController = {
  create: asyncHandler(async (req, res) => {
    const ms = await projectMilestoneService.createMilestone(req.params.projectId, req.user._id, req.body);
    return successResponse(res, 201, 'Milestone created.', ms);
  }),

  list: asyncHandler(async (req, res) => {
    const result = await projectMilestoneService.listMilestones(req.params.projectId);
    return successResponse(res, 200, 'Milestones fetched.', result);
  }),

  update: asyncHandler(async (req, res) => {
    const ms = await projectMilestoneService.updateMilestone(req.params.milestoneId, req.user._id, req.body);
    return successResponse(res, 200, 'Milestone updated.', ms);
  }),

  complete: asyncHandler(async (req, res) => {
    const ms = await projectMilestoneService.completeMilestone(req.params.milestoneId, req.user._id);
    return successResponse(res, 200, 'Milestone completed.', ms);
  }),

  delete: asyncHandler(async (req, res) => {
    const result = await projectMilestoneService.deleteMilestone(req.params.milestoneId, req.user._id);
    return successResponse(res, 200, 'Milestone deleted.', result);
  }),
};

module.exports = ProjectMilestoneController;
