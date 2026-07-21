const logger = require('../../../common/logger/winston');

module.exports = (io, socket) => {
  const userId = socket.user?.userId || socket.user?.id || socket.user?._id;

  /**
   * Join a project-specific room
   */
  socket.on('project:join', ({ projectId }) => {
    if (!projectId) return;
    const room = `project:${projectId}`;
    socket.join(room);
    logger.info(`🔌 User ${userId} joined project room: ${room}`);
  });

  /**
   * Leave a project-specific room
   */
  socket.on('project:leave', ({ projectId }) => {
    if (!projectId) return;
    const room = `project:${projectId}`;
    socket.leave(room);
    logger.info(`🔌 User ${userId} left project room: ${room}`);
  });

  /**
   * Typing indicator for project dashboard/chat
   */
  socket.on('project:typing', ({ projectId, channel = 'general' }) => {
    if (!projectId) return;
    socket.to(`project:${projectId}`).emit('project:typing', {
      userId,
      username: socket.user?.username,
      fullName: socket.user?.fullName,
      channel,
    });
  });

  /**
   * Stop typing indicator
   */
  socket.on('project:stopTyping', ({ projectId, channel = 'general' }) => {
    if (!projectId) return;
    socket.to(`project:${projectId}`).emit('project:stopTyping', {
      userId,
      channel,
    });
  });
};
