const projectApplicationService = require('../service/projectApplication.service');
const { successResponse } = require('../../../common/utils/response');
const asyncHandler = require('../../../common/middleware/asyncHandler');

const ProjectApplicationController = {
  /**
   * POST /api/v1/projects/:projectId/applications
   */
  apply: asyncHandler(async (req, res) => {
    const app = await projectApplicationService.apply(
      req.params.projectId,
      req.user._id,
      req.body
    );
    return successResponse(res, 201, 'Application submitted successfully.', app);
  }),

  /**
   * GET /api/v1/projects/:projectId/applications
   * (For project owners/admins)
   */
  listApplications: asyncHandler(async (req, res) => {
    const result = await projectApplicationService.listApplications(req.params.projectId, req.query);
    return successResponse(res, 200, 'Applications fetched.', result);
  }),

  /**
   * GET /api/v1/projects/applications/mine
   * Applications submitted by the current user
   */
  myApplications: asyncHandler(async (req, res) => {
    const result = await projectApplicationService.myApplications(req.user._id, req.query);
    return successResponse(res, 200, 'Your applications.', result);
  }),

  /**
   * GET /api/v1/projects/:projectId/applications/:applicationId
   */
  getApplication: asyncHandler(async (req, res) => {
    const app = await projectApplicationService.getApplication(req.params.applicationId);
    return successResponse(res, 200, 'Application fetched.', app);
  }),

  /**
   * PATCH /api/v1/projects/:projectId/applications/:applicationId/withdraw
   */
  withdraw: asyncHandler(async (req, res) => {
    const result = await projectApplicationService.withdraw(req.params.projectId, req.user._id);
    return successResponse(res, 200, 'Application withdrawn.', result);
  }),

  /**
   * PATCH /api/v1/projects/:projectId/applications/:applicationId/review
   */
  review: asyncHandler(async (req, res) => {
    const result = await projectApplicationService.review(
      req.params.applicationId,
      req.user._id,
      req.body.note
    );
    return successResponse(res, 200, 'Application moved to under-review.', result);
  }),

  /**
   * PATCH /api/v1/projects/:projectId/applications/:applicationId/shortlist
   */
  shortlist: asyncHandler(async (req, res) => {
    const result = await projectApplicationService.shortlist(
      req.params.applicationId,
      req.user._id,
      req.body.note
    );
    return successResponse(res, 200, 'Application shortlisted.', result);
  }),

  /**
   * PATCH /api/v1/projects/:projectId/applications/:applicationId/interview
   */
  scheduleInterview: asyncHandler(async (req, res) => {
    const result = await projectApplicationService.scheduleInterview(
      req.params.applicationId,
      req.user._id,
      req.body
    );
    return successResponse(res, 200, 'Interview scheduled.', result);
  }),

  /**
   * PATCH /api/v1/projects/:projectId/applications/:applicationId/accept
   */
  accept: asyncHandler(async (req, res) => {
    const result = await projectApplicationService.accept(
      req.params.applicationId,
      req.user._id,
      req.body.role
    );
    return successResponse(res, 200, 'Application accepted. Member added to project.', result);
  }),

  /**
   * PATCH /api/v1/projects/:projectId/applications/:applicationId/reject
   */
  reject: asyncHandler(async (req, res) => {
    const result = await projectApplicationService.reject(
      req.params.applicationId,
      req.user._id,
      req.body.reason
    );
    return successResponse(res, 200, 'Application rejected.', result);
  }),

  /**
   * GET /api/v1/projects/:projectId/applications/counts
   */
  counts: asyncHandler(async (req, res) => {
    const counts = await projectApplicationService.getApplicationCounts(req.params.projectId);
    return successResponse(res, 200, 'Application counts.', counts);
  }),
};

module.exports = ProjectApplicationController;
