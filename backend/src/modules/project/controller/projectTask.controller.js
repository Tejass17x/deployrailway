const projectTaskService = require('../service/projectTask.service');
const { successResponse } = require('../../../common/utils/response');
const asyncHandler = require('../../../common/middleware/asyncHandler');

const ProjectTaskController = {
  create: asyncHandler(async (req, res) => {
    const task = await projectTaskService.createTask(req.params.projectId, req.user._id, req.body);
    return successResponse(res, 201, 'Task created.', task);
  }),

  list: asyncHandler(async (req, res) => {
    const result = await projectTaskService.listTasks(req.params.projectId, req.query);
    return successResponse(res, 200, 'Tasks fetched.', result);
  }),

  kanban: asyncHandler(async (req, res) => {
    const board = await projectTaskService.getKanban(req.params.projectId);
    return successResponse(res, 200, 'Kanban board.', board);
  }),

  getOne: asyncHandler(async (req, res) => {
    const task = await projectTaskService.getTask(req.params.taskId);
    return successResponse(res, 200, 'Task fetched.', task);
  }),

  update: asyncHandler(async (req, res) => {
    const task = await projectTaskService.updateTask(req.params.taskId, req.user._id, req.body);
    return successResponse(res, 200, 'Task updated.', task);
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const task = await projectTaskService.updateStatus(
      req.params.taskId, req.user._id, req.body.status
    );
    return successResponse(res, 200, 'Task status updated.', task);
  }),

  addComment: asyncHandler(async (req, res) => {
    const task = await projectTaskService.addComment(
      req.params.taskId, req.user._id, req.body.content
    );
    return successResponse(res, 201, 'Comment added.', task);
  }),

  reorder: asyncHandler(async (req, res) => {
    const result = await projectTaskService.reorderTasks(
      req.params.projectId, req.body.status, req.body.orderedIds
    );
    return successResponse(res, 200, 'Tasks reordered.', result);
  }),

  delete: asyncHandler(async (req, res) => {
    const result = await projectTaskService.deleteTask(req.params.taskId, req.user._id);
    return successResponse(res, 200, 'Task deleted.', result);
  }),

  counts: asyncHandler(async (req, res) => {
    const counts = await projectTaskService.getTaskCounts(req.params.projectId);
    return successResponse(res, 200, 'Task counts.', counts);
  }),
};

module.exports = ProjectTaskController;
