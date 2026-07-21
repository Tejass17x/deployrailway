const BaseRepository = require('../../../common/repository/base.repository');
const { ProjectMember } = require('../../../models/ProjectMember');

class ProjectMemberRepository extends BaseRepository {
  constructor() {
    super(ProjectMember);
  }

  async findByProjectAndUser(projectId, userId) {
    return await this.model.findOne({
      projectId,
      userId,
      isDeleted: { $ne: true },
    });
  }

  async findActiveMembers(projectId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model
        .find({ projectId, status: 'active', isDeleted: { $ne: true } })
        .populate('userId', 'firstName lastName fullName profileImage username profileSlug email')
        .sort({ role: 1, createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.model.countDocuments({ projectId, status: 'active', isDeleted: { $ne: true } }),
    ]);
    return { docs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findMemberRole(projectId, userId) {
    const member = await this.model
      .findOne({ projectId, userId, status: 'active', isDeleted: { $ne: true } })
      .lean();
    return member ? member.role : null;
  }

  async countActiveMembers(projectId) {
    return await this.model.countDocuments({ projectId, status: 'active', isDeleted: { $ne: true } });
  }

  async isMember(projectId, userId) {
    return !!(await this.model.exists({ projectId, userId, status: 'active', isDeleted: { $ne: true } }));
  }

  async getUserProjects(userId, status = 'active') {
    return await this.model
      .find({ userId, status, isDeleted: { $ne: true } })
      .populate('projectId')
      .sort({ createdAt: -1 })
      .lean();
  }

  async updateMemberRole(projectId, userId, role) {
    return await this.model.findOneAndUpdate(
      { projectId, userId },
      { $set: { role } },
      { new: true }
    );
  }

  async updateMemberStatus(projectId, userId, statusData) {
    return await this.model.findOneAndUpdate(
      { projectId, userId },
      { $set: statusData },
      { new: true }
    );
  }

  async updatePermissions(projectId, userId, permissions) {
    return await this.model.findOneAndUpdate(
      { projectId, userId },
      { $set: { permissions } },
      { new: true }
    );
  }

  async removeMember(projectId, userId) {
    return await this.model.findOneAndUpdate(
      { projectId, userId },
      { $set: { status: 'left', isDeleted: true } },
      { new: true }
    );
  }
}

module.exports = new ProjectMemberRepository();
