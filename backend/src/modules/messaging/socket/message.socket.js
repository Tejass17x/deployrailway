const messageService = require('../service/message.service');
const logger = require('../../../common/logger/winston');
const Message = require('../model/Message');

module.exports = (io, socket) => {
  const userId = socket.user?.userId || socket.user?.id || socket.user?._id;
  if (!userId) {
    logger.warn(`socket.user is missing userId properties for socket: ${socket.id}`);
    return;
  }
  const userIdStr = userId.toString();

  // Helper for joining rooms
  const handleJoin = async (conversationId) => {
    if (!conversationId) return;
    const roomId = `conversation:${conversationId}`;
    socket.join(roomId);
    logger.info(`💬 Socket ${socket.id} (User: ${userIdStr}) joined room: ${roomId}`);

    try {
      // Auto-mark incoming messages as read and notify sender
      const undelivered = await Message.find({
        conversationId,
        senderId: { $ne: userId },
        status: { $in: ['sent', 'delivered'] }
      }).select('_id senderId').lean();

      if (undelivered.length > 0) {
        const now = new Date();
        await Message.updateMany(
          { _id: { $in: undelivered.map(m => m._id) } },
          { $set: { status: 'read', readAt: now } }
        );

        // Also update backward compatible seen status
        await Message.updateMany(
          { _id: { $in: undelivered.map(m => m._id) } },
          { $set: { status: 'seen' } }
        );

        // Reset unread count for current user
        const Conversation = require('../model/Conversation');
        await Conversation.findByIdAndUpdate(conversationId, {
          $set: { [`unreadCounts.${userIdStr}`]: 0 }
        });

        // Group by sender and emit messageRead to each unique sender
        const senderIds = [...new Set(undelivered.map(m => m.senderId.toString()))];
        senderIds.forEach(senderId => {
          io.to(`user:${senderId}`).emit('message:read', { conversationId, readBy: userIdStr, readAt: now });
          io.to(`user:${senderId}`).emit('messageRead', { conversationId, readBy: userIdStr, readAt: now });
          io.to(`user:${senderId}`).emit('message:seen', { conversationId, readBy: userIdStr, readAt: now });
        });

        // Refresh conversation list for current user
        io.to(`user:${userIdStr}`).emit('conversation:update', { conversationId });
        io.to(`user:${userIdStr}`).emit('conversationUpdated', { conversationId });
      }
    } catch (err) {
      logger.error(`Auto-read on chat:join error: ${err.message}`);
    }
  };

  // Helper for leaving rooms
  const handleLeave = (conversationId) => {
    if (!conversationId) return;
    const roomId = `conversation:${conversationId}`;
    socket.leave(roomId);
    logger.info(`💬 Socket ${socket.id} (User: ${userIdStr}) left room: ${roomId}`);
  };

  // Join/Leave events (both old and new style)
  socket.on('chat:join', ({ conversationId }) => handleJoin(conversationId));
  socket.on('joinConversation', ({ conversationId }) => handleJoin(conversationId));

  socket.on('chat:leave', ({ conversationId }) => handleLeave(conversationId));
  socket.on('leaveConversation', ({ conversationId }) => handleLeave(conversationId));

  // Typing indicators
  const handleTypingStart = (conversationId) => {
    if (!conversationId) return;
    socket.to(`conversation:${conversationId}`).emit('typing:start', { conversationId, userId: userIdStr });
    socket.to(`conversation:${conversationId}`).emit('typing', { conversationId, userId: userIdStr });
  };

  const handleTypingStop = (conversationId) => {
    if (!conversationId) return;
    socket.to(`conversation:${conversationId}`).emit('typing:stop', { conversationId, userId: userIdStr });
    socket.to(`conversation:${conversationId}`).emit('stopTyping', { conversationId, userId: userIdStr });
  };

  socket.on('chat:typing', ({ conversationId }) => handleTypingStart(conversationId));
  socket.on('typing', ({ conversationId }) => handleTypingStart(conversationId));
  socket.on('typing:start', ({ conversationId }) => handleTypingStart(conversationId));

  socket.on('chat:stopTyping', ({ conversationId }) => handleTypingStop(conversationId));
  socket.on('stopTyping', ({ conversationId }) => handleTypingStop(conversationId));
  socket.on('typing:stop', ({ conversationId }) => handleTypingStop(conversationId));

  // Mark Read events
  const handleMarkRead = async (conversationId) => {
    if (!conversationId) return;
    try {
      await messageService.markAsRead(userId, conversationId);
    } catch (err) {
      logger.error(`Error marking message as read via socket: ${err.message}`);
    }
  };

  socket.on('chat:read', ({ conversationId }) => handleMarkRead(conversationId));
  socket.on('messageRead', ({ conversationId }) => handleMarkRead(conversationId));

  // Send Message socket event
  socket.on('sendMessage', async (payload) => {
    try {
      await messageService.sendMessage(userId, payload);
    } catch (err) {
      logger.error(`Socket sendMessage handler failed: ${err.message}`);
    }
  });

  socket.on('message:send', async (payload) => {
    try {
      await messageService.sendMessage(userId, payload);
    } catch (err) {
      logger.error(`Socket message:send handler failed: ${err.message}`);
    }
  });

  // Acknowledge Delivery
  const handleAckDelivery = async ({ messageId, conversationId }) => {
    if (!messageId) return;
    try {
      const now = new Date();
      const msg = await Message.findOneAndUpdate(
        { _id: messageId, senderId: { $ne: userId }, status: 'sent' },
        { $set: { status: 'delivered', deliveredAt: now } },
        { new: true }
      ).lean();

      if (msg) {
        io.to(`user:${msg.senderId}`).emit('message:delivered', { messageId, conversationId, deliveredTo: userIdStr, deliveredAt: now });
        io.to(`user:${msg.senderId}`).emit('messageDelivered', { messageId, conversationId, deliveredTo: userIdStr, deliveredAt: now });
      }
    } catch (err) {
      logger.error(`Socket message acknowledgement error: ${err.message}`);
    }
  };

  socket.on('message:ack', handleAckDelivery);
  socket.on('messageDelivered', handleAckDelivery);

  // Edit message
  socket.on('messageEdited', async ({ messageId, text }) => {
    try {
      await messageService.editMessage(userId, messageId, text);
    } catch (err) {
      logger.error(`Socket messageEdited error: ${err.message}`);
    }
  });

  // Delete message
  socket.on('messageDeleted', async ({ messageId, deleteType }) => {
    try {
      await messageService.deleteMessage(userId, messageId, deleteType);
    } catch (err) {
      logger.error(`Socket messageDeleted error: ${err.message}`);
    }
  });

  // Reactions
  socket.on('reactionAdded', async ({ messageId, reaction }) => {
    try {
      await messageService.reactToMessage(userId, messageId, reaction);
      const msg = await Message.findById(messageId).select('conversationId').lean();
      if (msg) {
        socket.to(`conversation:${msg.conversationId}`).emit('reactionAdded', { messageId, userId: userIdStr, reaction });
      }
    } catch (err) {
      logger.error(`Socket reactionAdded error: ${err.message}`);
    }
  });

  socket.on('reactionRemoved', async ({ messageId }) => {
    try {
      await messageService.reactToMessage(userId, messageId, '');
      const msg = await Message.findById(messageId).select('conversationId').lean();
      if (msg) {
        socket.to(`conversation:${msg.conversationId}`).emit('reactionRemoved', { messageId, userId: userIdStr });
      }
    } catch (err) {
      logger.error(`Socket reactionRemoved error: ${err.message}`);
    }
  });
};

