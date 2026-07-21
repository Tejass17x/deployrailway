const BaseRepository = require('../../../common/repository/base.repository');
const ProjectMilestone = require('../../../models/ProjectMilestone');

class ProjectMilestoneRepository extends BaseRepository {
  constructor() {
    super(ProjectMilestone);
  }

  async findByProject(projectId) {
    return await this.model
      .find({ projectId, isDeleted: { $ne: true } })
      .sort({ order: 1, targetDate: 1 })
      .lean();
  }

  async markCompleted(milestoneId) {
    return await this.model.findByIdAndUpdate(
      milestoneId,
      { $set: { isCompleted: true, progress: 100, completedAt: new Date() } },
      { new: true }
    );
  }

  async updateProgress(milestoneId, completedTasks, totalTasks) {
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return await this.model.findByIdAndUpdate(
      milestoneId,
      { $set: { progress, completedTaskCount: completedTasks, taskCount: totalTasks } },
      { new: true }
    );
  }
}

module.exports = new ProjectMilestoneRepository();
