const projectTaskRepository = require('../repository/projectTask.repository');
const projectRepository = require('../repository/project.repository');
const activityLogRepository = require('../repository/projectActivityLog.repository');
const projectNotification = require('../helper/projectNotification.helper');
const { NotFoundError, ForbiddenError } = require('../../../common/errors/AppError');

const ProjectTaskService = {
  async createTask(projectId, createdBy, data) {
    const task = await projectTaskRepository.create({
      ...data,
      projectId,
      createdBy,
      status: data.status || 'backlog',
      priority: data.priority || 'medium',
    });

    await projectRepository.incrementCounter(projectId, 'taskCount', 1);

    await activityLogRepository.log({
      projectId,
      actorId: createdBy,
      type: 'task_created',
      description: `Task "${task.title}" created`,
      resourceType: 'task',
      resourceId: task._id,
    });

    // Notify assignees
    if (data.assignees && data.assignees.length > 0) {
      const project = await projectRepository.findById(projectId);
      for (const assigneeId of data.assignees) {
        if (assigneeId.toString() !== createdBy.toString()) {
          await projectNotification.notifyUser(assigneeId, {
            type: 'task_assigned',
            actorId: createdBy,
            projectId,
            resourceId: task._id,
            message: `You have been assigned to task "${task.title}" in "${project?.title}".`,
          });
        }
      }
    }

    return task;
  },

  async listTasks(projectId, query) {
    return await projectTaskRepository.findByProject(projectId, query);
  },

  async getKanban(projectId) {
    return await projectTaskRepository.findKanban(projectId);
  },

  async getTask(taskId) {
    const task = await projectTaskRepository.findById(taskId, 'assignees createdBy milestoneId');
    if (!task) throw new NotFoundError('Task not found.');
    return task;
  },

  async updateTask(taskId, userId, data) {
    const task = await projectTaskRepository.findById(taskId);
    if (!task) throw new NotFoundError('Task not found.');

    // Prevent changing projectId
    delete data.projectId;
    delete data.createdBy;

    Object.assign(task, data);
    if (data.status === 'done' && !task.completedAt) task.completedAt = new Date();
    await task.save();

    await activityLogRepository.log({
      projectId: task.projectId,
      actorId: userId,
      type: 'task_updated',
      description: `Task "${task.title}" updated`,
      resourceType: 'task',
      resourceId: task._id,
    });

    return task;
  },

  async updateStatus(taskId, userId, status) {
    const task = await projectTaskRepository.updateStatus(taskId, status, userId);
    if (!task) throw new NotFoundError('Task not found.');

    if (status === 'done') {
      await activityLogRepository.log({
        projectId: task.projectId,
        actorId: userId,
        type: 'task_completed',
        description: `Task "${task.title}" marked as done`,
      });
    }

    return task;
  },

  async addComment(taskId, userId, content) {
    const task = await projectTaskRepository.addComment(taskId, {
      userId,
      content,
      createdAt: new Date(),
    });
    if (!task) throw new NotFoundError('Task not found.');
    return task;
  },

  async reorderTasks(projectId, status, orderedIds) {
    await projectTaskRepository.reorderTasks(projectId, status, orderedIds);
    return { reordered: true };
  },

  async deleteTask(taskId, userId) {
    const task = await projectTaskRepository.findById(taskId);
    if (!task) throw new NotFoundError('Task not found.');

    await projectTaskRepository.softDelete(taskId, userId);
    await projectRepository.incrementCounter(task.projectId, 'taskCount', -1);

    await activityLogRepository.log({
      projectId: task.projectId,
      actorId: userId,
      type: 'task_deleted',
      description: `Task "${task.title}" deleted`,
    });

    return { deleted: true };
  },

  async getTaskCounts(projectId) {
    const rows = await projectTaskRepository.countByStatus(projectId);
    return rows.reduce((acc, r) => { acc[r._id] = r.count; return acc; }, {});
  },
};

module.exports = ProjectTaskService;
