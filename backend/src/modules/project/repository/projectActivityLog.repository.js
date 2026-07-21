const BaseRepository = require('../../../common/repository/base.repository');
const { ProjectActivityLog } = require('../../../models/ProjectActivityLog');

class ProjectActivityLogRepository extends BaseRepository {
  constructor() {
    super(ProjectActivityLog);
  }

  async log({ projectId, actorId, type, description, resourceType, resourceId, metadata, ipAddress, userAgent }) {
    return await this.model.create({
      projectId,
      actorId,
      type,
      description,
      resourceType,
      resourceId,
      metadata,
      ipAddress,
      userAgent,
    });
  }

  async findByProject(projectId, { type, actorId, page = 1, limit = 30 } = {}) {
    const filter = { projectId };
    if (type) filter.type = type;
    if (actorId) filter.actorId = actorId;

    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('actorId', 'firstName lastName fullName profileImage username')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      this.model.countDocuments(filter),
    ]);
    return { docs, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
  }
}

module.exports = new ProjectActivityLogRepository();
