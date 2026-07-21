const projectService = require('../service/project.service');
const { successResponse, errorResponse } = require('../../../common/utils/response');
const asyncHandler = require('../../../common/middleware/asyncHandler');

const ProjectController = {
  /**
   * POST /api/v1/projects
   * Create a new project
   */
  create: asyncHandler(async (req, res) => {
    const project = await projectService.createProject(req.user._id, req.body);
    return successResponse(res, 201, 'Project created successfully.', project);
  }),

  /**
   * GET /api/v1/projects
   * List & search projects (public)
   */
  list: asyncHandler(async (req, res) => {
    const result = await projectService.listProjects({
      ...req.query,
      visibility: req.query.visibility || 'public',
    });
    return successResponse(res, 200, 'Projects fetched.', result);
  }),

  /**
   * GET /api/v1/projects/trending
   */
  trending: asyncHandler(async (req, res) => {
    const data = await projectService.getTrending(Number(req.query.limit) || 10);
    return successResponse(res, 200, 'Trending projects.', data);
  }),

  /**
   * GET /api/v1/projects/recommended
   */
  recommended: asyncHandler(async (req, res) => {
    const data = await projectService.getRecommended(req.user, Number(req.query.limit) || 10);
    return successResponse(res, 200, 'Recommended projects.', data);
  }),

  /**
   * GET /api/v1/projects/my
   * Projects owned by current user
   */
  myProjects: asyncHandler(async (req, res) => {
    const result = await projectService.listProjects({
      ...req.query,
      owner: req.user._id,
      visibility: undefined,
    });
    return successResponse(res, 200, 'Your projects.', result);
  }),

  /**
   * GET /api/v1/projects/stats/owner
   * Dashboard stats for the logged-in owner
   */
  ownerStats: asyncHandler(async (req, res) => {
    const stats = await projectService.getOwnerStats(req.user._id);
    return successResponse(res, 200, 'Owner stats.', stats);
  }),

  /**
   * GET /api/v1/projects/:id
   * Get project detail (public or private with access check)
   */
  getOne: asyncHandler(async (req, res) => {
    const project = await projectService.getProject(
      req.params.id,
      req.user?._id
    );
    return successResponse(res, 200, 'Project fetched.', project);
  }),

  /**
   * PUT /api/v1/projects/:id
   * Update project (owner or admin only)
   */
  update: asyncHandler(async (req, res) => {
    const project = await projectService.updateProject(
      req.params.id,
      req.user._id,
      req.body
    );
    return successResponse(res, 200, 'Project updated.', project);
  }),

  /**
   * PATCH /api/v1/projects/:id/status
   */
  updateStatus: asyncHandler(async (req, res) => {
    const { status } = req.body;
    const project = await projectService.updateStatus(req.params.id, req.user._id, status);
    return successResponse(res, 200, 'Project status updated.', project);
  }),

  /**
   * PATCH /api/v1/projects/:id/progress
   */
  updateProgress: asyncHandler(async (req, res) => {
    const { progress } = req.body;
    const project = await projectService.updateProgress(req.params.id, req.user._id, Number(progress));
    return successResponse(res, 200, 'Project progress updated.', project);
  }),

  /**
   * PATCH /api/v1/projects/:id/archive
   */
  archive: asyncHandler(async (req, res) => {
    const project = await projectService.archiveProject(req.params.id, req.user._id);
    return successResponse(res, 200, project.isArchived ? 'Project archived.' : 'Project unarchived.', project);
  }),

  /**
   * DELETE /api/v1/projects/:id
   */
  delete: asyncHandler(async (req, res) => {
    const result = await projectService.deleteProject(req.params.id, req.user._id);
    return successResponse(res, 200, 'Project deleted.', result);
  }),
};

module.exports = ProjectController;
