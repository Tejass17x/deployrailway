const BaseRepository = require('../../../common/repository/base.repository');
const ProjectMessage = require('../../../models/ProjectMessage');

class ProjectMessageRepository extends BaseRepository {
  constructor() {
    super(ProjectMessage);
  }

  async findTopLevel(projectId, { page = 1, limit = 50, before } = {}) {
    const filter = { projectId, threadId: null, isDeleted: { $ne: true } };
    if (before) filter.createdAt = { $lt: new Date(before) };

    const messages = await this.model
      .find(filter)
      .populate('senderId', 'firstName lastName fullName profileImage username')
      .sort('-createdAt')
      .limit(Number(limit))
      .lean();

    return messages.reverse(); // Chronological order
  }

  async findThread(projectId, threadId, limit = 30) {
    return await this.model
      .find({ projectId, threadId, isDeleted: { $ne: true } })
      .populate('senderId', 'firstName lastName fullName profileImage username')
      .sort('createdAt')
      .limit(limit)
      .lean();
  }

  async findPinned(projectId) {
    return await this.model
      .find({ projectId, isPinned: true, isDeleted: { $ne: true } })
      .populate('senderId', 'firstName lastName fullName profileImage username')
      .sort('-pinnedAt')
      .lean();
  }

  async togglePin(messageId, pinnedBy) {
    const msg = await this.model.findById(messageId);
    if (!msg) return null;
    msg.isPinned = !msg.isPinned;
    msg.pinnedBy = msg.isPinned ? pinnedBy : null;
    msg.pinnedAt = msg.isPinned ? new Date() : null;
    return await msg.save();
  }

  async addReaction(messageId, userId, emoji) {
    const msg = await this.model.findById(messageId);
    if (!msg) return null;
    const existing = msg.reactions.find((r) => r.emoji === emoji);
    if (existing) {
      const userIndex = existing.users.indexOf(userId);
      if (userIndex > -1) {
        existing.users.splice(userIndex, 1);
        existing.count = Math.max(0, existing.count - 1);
      } else {
        existing.users.push(userId);
        existing.count += 1;
      }
    } else {
      msg.reactions.push({ emoji, count: 1, users: [userId] });
    }
    return await msg.save();
  }

  async markRead(messageId, userId) {
    const alreadyRead = await this.model.exists({
      _id: messageId,
      'readBy.userId': userId,
    });
    if (alreadyRead) return null;
    return await this.model.findByIdAndUpdate(
      messageId,
      { $push: { readBy: { userId, readAt: new Date() } } },
      { new: true }
    );
  }

  async softDelete(messageId, deletedBy) {
    return await this.model.findByIdAndUpdate(
      messageId,
      { $set: { isDeleted: true, deletedAt: new Date(), deletedBy, content: '[Message deleted]' } },
      { new: true }
    );
  }

  async countByProject(projectId) {
    return await this.model.countDocuments({ projectId, threadId: null, isDeleted: { $ne: true } });
  }
}

module.exports = new ProjectMessageRepository();
