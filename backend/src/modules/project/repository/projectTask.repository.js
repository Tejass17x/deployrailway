const BaseRepository = require('../../../common/repository/base.repository');
const { ProjectTask } = require('../../../models/ProjectTask');

class ProjectTaskRepository extends BaseRepository {
  constructor() {
    super(ProjectTask);
  }

  async findByProject(projectId, { status, assignee, priority, milestoneId, page = 1, limit = 50, sort = 'status order' } = {}) {
    const filter = { projectId, isDeleted: { $ne: true } };
    if (status) filter.status = status;
    if (assignee) filter.assignees = assignee;
    if (priority) filter.priority = priority;
    if (milestoneId) filter.milestoneId = milestoneId;

    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('assignees', 'firstName lastName fullName profileImage username')
        .populate('createdBy', 'firstName lastName fullName profileImage username')
        .populate('milestoneId', 'title')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      this.model.countDocuments(filter),
    ]);

    return { docs, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
  }

  async findKanban(projectId) {
    const tasks = await this.model
      .find({ projectId, isDeleted: { $ne: true } })
      .populate('assignees', 'firstName lastName fullName profileImage username')
      .sort({ order: 1, createdAt: 1 })
      .lean();

    // Group by status
    return tasks.reduce((acc, task) => {
      if (!acc[task.status]) acc[task.status] = [];
      acc[task.status].push(task);
      return acc;
    }, {});
  }

  async updateStatus(taskId, status, userId) {
    const update = { status };
    if (status === 'done') update.completedAt = new Date();
    return await this.model.findByIdAndUpdate(taskId, { $set: update }, { new: true });
  }

  async addComment(taskId, comment) {
    const task = await this.model.findByIdAndUpdate(
      taskId,
      { $push: { comments: comment }, $inc: { commentCount: 1 } },
      { new: true }
    );
    return task;
  }

  async reorderTasks(projectId, status, orderedIds) {
    const ops = orderedIds.map((id, index) => ({
      updateOne: { filter: { _id: id, projectId, status }, update: { $set: { order: index } } },
    }));
    return await this.model.bulkWrite(ops);
  }

  async countByStatus(projectId) {
    return await this.model.aggregate([
      { $match: { projectId, isDeleted: { $ne: true } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  }
}

module.exports = new ProjectTaskRepository();
