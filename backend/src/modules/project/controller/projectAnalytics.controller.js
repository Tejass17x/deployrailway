const projectAnalyticsService = require('../service/projectAnalytics.service');
const { successResponse } = require('../../../common/utils/response');
const asyncHandler = require('../../../common/middleware/asyncHandler');

const ProjectAnalyticsController = {
  dashboard: asyncHandler(async (req, res) => {
    const data = await projectAnalyticsService.getProjectDashboard(req.params.projectId);
    return successResponse(res, 200, 'Project analytics.', data);
  }),

  activityTimeline: asyncHandler(async (req, res) => {
    const days = Number(req.query.days) || 30;
    const data = await projectAnalyticsService.getActivityTimeline(req.params.projectId, days);
    return successResponse(res, 200, 'Activity timeline.', data);
  }),

  ownerAnalytics: asyncHandler(async (req, res) => {
    const data = await projectAnalyticsService.getOwnerAnalytics(req.user._id);
    return successResponse(res, 200, 'Owner analytics.', data);
  }),
};

module.exports = ProjectAnalyticsController;
