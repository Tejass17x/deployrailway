const projectMilestoneRepository = require('../repository/projectMilestone.repository');
const projectTaskRepository = require('../repository/projectTask.repository');
const activityLogRepository = require('../repository/projectActivityLog.repository');
const { NotFoundError } = require('../../../common/errors/AppError');

const ProjectMilestoneService = {
  async createMilestone(projectId, createdBy, data) {
    const milestone = await projectMilestoneRepository.create({ ...data, projectId, createdBy });
    await activityLogRepository.log({
      projectId, actorId: createdBy, type: 'milestone_created',
      description: `Milestone "${milestone.title}" created`,
      resourceType: 'milestone', resourceId: milestone._id,
    });
    return milestone;
  },

  async listMilestones(projectId) {
    return await projectMilestoneRepository.findByProject(projectId);
  },

  async updateMilestone(milestoneId, userId, data) {
    const milestone = await projectMilestoneRepository.findById(milestoneId);
    if (!milestone) throw new NotFoundError('Milestone not found.');
    Object.assign(milestone, data);
    await milestone.save();
    await activityLogRepository.log({
      projectId: milestone.projectId, actorId: userId, type: 'milestone_updated',
      description: `Milestone "${milestone.title}" updated`,
    });
    return milestone;
  },

  async completeMilestone(milestoneId, userId) {
    const milestone = await projectMilestoneRepository.markCompleted(milestoneId);
    if (!milestone) throw new NotFoundError('Milestone not found.');
    await activityLogRepository.log({
      projectId: milestone.projectId, actorId: userId, type: 'milestone_completed',
      description: `Milestone "${milestone.title}" completed`,
    });
    return milestone;
  },

  async deleteMilestone(milestoneId, userId) {
    const milestone = await projectMilestoneRepository.findById(milestoneId);
    if (!milestone) throw new NotFoundError('Milestone not found.');
    await projectMilestoneRepository.softDelete(milestoneId, userId);
    await activityLogRepository.log({
      projectId: milestone.projectId, actorId: userId, type: 'milestone_deleted',
      description: `Milestone "${milestone.title}" deleted`,
    });
    return { deleted: true };
  },

  async syncProgressFromTasks(milestoneId) {
    const { ProjectTask } = require('../../../models/ProjectTask');
    const [total, completed] = await Promise.all([
      ProjectTask.countDocuments({ milestoneId, isDeleted: { $ne: true } }),
      ProjectTask.countDocuments({ milestoneId, status: 'done', isDeleted: { $ne: true } }),
    ]);
    return await projectMilestoneRepository.updateProgress(milestoneId, completed, total);
  },
};

module.exports = ProjectMilestoneService;
