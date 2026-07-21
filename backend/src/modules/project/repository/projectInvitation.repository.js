const BaseRepository = require('../../../common/repository/base.repository');
const ProjectInvitation = require('../../../models/ProjectInvitation');

class ProjectInvitationRepository extends BaseRepository {
  constructor() {
    super(ProjectInvitation);
  }

  async findPending(projectId, userId) {
    return await this.model.findOne({
      projectId,
      invitedUser: userId,
      status: 'pending',
      isDeleted: { $ne: true },
      expiresAt: { $gt: new Date() },
    });
  }

  async findByProject(projectId, { status, page = 1, limit = 20 } = {}) {
    const filter = { projectId, isDeleted: { $ne: true } };
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('invitedUser', 'firstName lastName fullName profileImage username email')
        .populate('invitedBy', 'firstName lastName fullName profileImage username')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      this.model.countDocuments(filter),
    ]);
    return { docs, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
  }

  async findForUser(userId, { status = 'pending', page = 1, limit = 10 } = {}) {
    const filter = { invitedUser: userId, isDeleted: { $ne: true } };
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('projectId', 'title slug coverImage status owner')
        .populate('invitedBy', 'firstName lastName fullName profileImage username')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      this.model.countDocuments(filter),
    ]);
    return { docs, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
  }

  async respond(invitationId, status, note = '') {
    return await this.model.findByIdAndUpdate(
      invitationId,
      { $set: { status, respondedAt: new Date(), rejectionReason: note } },
      { new: true }
    );
  }

  async cancel(invitationId, cancelledBy) {
    return await this.model.findByIdAndUpdate(
      invitationId,
      { $set: { status: 'cancelled', cancelledAt: new Date(), cancelledBy } },
      { new: true }
    );
  }
}

module.exports = new ProjectInvitationRepository();
