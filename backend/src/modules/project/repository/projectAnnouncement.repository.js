const BaseRepository = require('../../../common/repository/base.repository');
const ProjectAnnouncement = require('../../../models/ProjectAnnouncement');

class ProjectAnnouncementRepository extends BaseRepository {
  constructor() {
    super(ProjectAnnouncement);
  }

  async findByProject(projectId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model
        .find({ projectId, isDeleted: { $ne: true } })
        .populate('authorId', 'firstName lastName fullName profileImage username')
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      this.model.countDocuments({ projectId, isDeleted: { $ne: true } }),
    ]);
    return { docs, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
  }

  async markRead(announcementId, userId) {
    return await this.model.findByIdAndUpdate(
      announcementId,
      { $addToSet: { readBy: userId }, $inc: { readCount: 1 } },
      { new: true }
    );
  }

  async togglePin(announcementId) {
    const ann = await this.model.findById(announcementId);
    if (!ann) return null;
    ann.isPinned = !ann.isPinned;
    ann.pinnedAt = ann.isPinned ? new Date() : null;
    return await ann.save();
  }
}

module.exports = new ProjectAnnouncementRepository();
