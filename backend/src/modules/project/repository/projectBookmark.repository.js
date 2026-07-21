const BaseRepository = require('../../../common/repository/base.repository');
const ProjectBookmark = require('../../../models/ProjectBookmark');

class ProjectBookmarkRepository extends BaseRepository {
  constructor() {
    super(ProjectBookmark);
  }

  async toggle(projectId, userId, type = 'bookmark') {
    const existing = await this.model.findOne({ projectId, userId, type });
    if (existing) {
      await this.model.deleteOne({ _id: existing._id });
      return { action: 'removed', type };
    }
    await this.model.create({ projectId, userId, type });
    return { action: 'added', type };
  }

  async findUserBookmarks(userId, type = 'bookmark', { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model
        .find({ userId, type })
        .populate('projectId', 'title slug coverImage status owner researchDomain')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      this.model.countDocuments({ userId, type }),
    ]);
    return { docs, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
  }

  async isBookmarked(projectId, userId, type = 'bookmark') {
    return !!(await this.model.exists({ projectId, userId, type }));
  }

  async countByType(projectId) {
    return await this.model.aggregate([
      { $match: { projectId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
  }
}

module.exports = new ProjectBookmarkRepository();
