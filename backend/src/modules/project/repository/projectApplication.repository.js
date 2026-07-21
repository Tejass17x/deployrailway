const BaseRepository = require('../../../common/repository/base.repository');
const { ProjectApplication } = require('../../../models/ProjectApplication');

class ProjectApplicationRepository extends BaseRepository {
  constructor() {
    super(ProjectApplication);
  }

  async findByProjectAndApplicant(projectId, applicantId) {
    return await this.model.findOne({ projectId, applicantId, isDeleted: { $ne: true } });
  }

  async findByProject(projectId, { status, page = 1, limit = 20, sort = '-createdAt' } = {}) {
    const filter = { projectId, isDeleted: { $ne: true } };
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('applicantId', 'firstName lastName fullName profileImage username email profileSlug')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      this.model.countDocuments(filter),
    ]);
    return { docs, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
  }

  async findByApplicant(applicantId, { status, page = 1, limit = 10 } = {}) {
    const filter = { applicantId, isDeleted: { $ne: true } };
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('projectId', 'title slug coverImage status owner')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      this.model.countDocuments(filter),
    ]);
    return { docs, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
  }

  async updateStatus(applicationId, status, changedBy, note = '') {
    const statusEntry = { status, changedBy, changedAt: new Date(), note };
    return await this.model.findByIdAndUpdate(
      applicationId,
      {
        $set: { status },
        $push: { statusHistory: statusEntry },
      },
      { new: true }
    );
  }

  async countByProject(projectId) {
    return await this.model.aggregate([
      { $match: { projectId, isDeleted: { $ne: true } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  }

  async hasApplied(projectId, applicantId) {
    return !!(await this.model.exists({
      projectId, applicantId, isDeleted: { $ne: true }, status: { $nin: ['withdrawn'] },
    }));
  }
}

module.exports = new ProjectApplicationRepository();
