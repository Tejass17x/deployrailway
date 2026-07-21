const projectMessageRepository = require('../repository/projectMessage.repository');
const projectRepository = require('../repository/project.repository');
const activityLogRepository = require('../repository/projectActivityLog.repository');
const { getIO } = require('../../../config/socket');
const { NotFoundError, ForbiddenError, ValidationError } = require('../../../common/errors/AppError');

const ProjectMessageService = {
  async sendMessage(projectId, senderId, data) {
    const { content, contentType = 'text', threadId, attachments, mentions, codeLanguage } = data;

    if (!content && (!attachments || attachments.length === 0)) {
      throw new ValidationError('Message must have content or attachments.');
    }

    const message = await projectMessageRepository.create({
      projectId,
      senderId,
      content,
      contentType,
      threadId: threadId || null,
      attachments: attachments || [],
      mentions: mentions || [],
      codeLanguage,
    });

    // Populate for socket emit
    const populated = await projectMessageRepository.model
      .findById(message._id)
      .populate('senderId', 'firstName lastName fullName profileImage username')
      .lean();

    // Increment reply count on parent if reply
    if (threadId) {
      await projectMessageRepository.model.findByIdAndUpdate(threadId, { $inc: { replyCount: 1 } });
    }

    await projectRepository.incrementCounter(projectId, 'messageCount', 1);

    // Emit to project room via Socket.IO
    try {
      const io = getIO();
      if (io) {
        io.to(`project:${projectId}`).emit('chat:new', { projectId, message: populated });
      }
    } catch (e) {
      // Socket not critical
    }

    return populated;
  },

  async getMessages(projectId, query) {
    return await projectMessageRepository.findTopLevel(projectId, query);
  },

  async getThread(projectId, threadId) {
    const parent = await projectMessageRepository.findById(threadId);
    if (!parent) throw new NotFoundError('Message not found.');
    if (parent.projectId.toString() !== projectId.toString()) throw new ForbiddenError('Message does not belong to this project.');

    const replies = await projectMessageRepository.findThread(projectId, threadId);
    return { parent, replies };
  },

  async getPinnedMessages(projectId) {
    return await projectMessageRepository.findPinned(projectId);
  },

  async togglePin(messageId, userId) {
    return await projectMessageRepository.togglePin(messageId, userId);
  },

  async addReaction(messageId, userId, emoji) {
    if (!emoji) throw new ValidationError('Emoji is required.');
    return await projectMessageRepository.addReaction(messageId, userId, emoji);
  },

  async editMessage(messageId, userId, newContent) {
    const message = await projectMessageRepository.findById(messageId);
    if (!message) throw new NotFoundError('Message not found.');
    if (message.senderId.toString() !== userId.toString()) throw new ForbiddenError('You can only edit your own messages.');
    if (message.isDeleted) throw new ForbiddenError('Cannot edit a deleted message.');

    message.editHistory.push({ content: message.content, editedAt: new Date() });
    message.content = newContent;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    return message;
  },

  async deleteMessage(messageId, userId, isAdmin = false) {
    const message = await projectMessageRepository.findById(messageId);
    if (!message) throw new NotFoundError('Message not found.');
    if (!isAdmin && message.senderId.toString() !== userId.toString()) {
      throw new ForbiddenError('You can only delete your own messages.');
    }
    return await projectMessageRepository.softDelete(messageId, userId);
  },

  async markRead(messageId, userId) {
    return await projectMessageRepository.markRead(messageId, userId);
  },
};

module.exports = ProjectMessageService;
