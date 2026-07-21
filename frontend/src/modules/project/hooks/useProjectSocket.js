import { useEffect, useState } from 'react';
import { useSocket } from '../../../context/SocketContext';
import { useQueryClient } from '@tanstack/react-query';

export const useProjectSocket = (projectId) => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [typingUsers, setTypingUsers] = useState({}); // { userId: { username, fullName, channel } }

  useEffect(() => {
    if (!socket || !projectId) return;

    // Join project room
    socket.emit('project:join', { projectId });

    // Listen for new chat messages
    const handleNewMessage = ({ projectId: msgProjId, message }) => {
      if (msgProjId !== projectId) return;
      queryClient.setQueryData(['project:messages', projectId], (old) => {
        if (!old) return [message];
        // Ensure no duplicates
        if (old.some((m) => m._id === message._id)) return old;
        return [...old, message];
      });
      queryClient.invalidateQueries({ queryKey: ['project:messages', projectId] });
    };

    // Typing indicators
    const handleTyping = ({ userId, username, fullName, channel }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [userId]: { username, fullName, channel, timestamp: Date.now() },
      }));
    };

    const handleStopTyping = ({ userId }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    };

    // Project update triggers
    const handleTaskUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['project:tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project:kanban', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project:taskCounts', projectId] });
    };

    const handleMilestoneUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['project:milestones', projectId] });
    };

    const handleMemberUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['project:members', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project:permissions', projectId] });
    };

    const handleFileUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['project:files', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project:folders', projectId] });
    };

    const handleAnnouncementUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['project:announcements', projectId] });
    };

    // Register listeners
    socket.on('chat:new', handleNewMessage);
    socket.on('project:typing', handleTyping);
    socket.on('project:stopTyping', handleStopTyping);
    
    // Custom sync signals from other users' activities
    socket.on('project:task_update', handleTaskUpdate);
    socket.on('project:milestone_update', handleMilestoneUpdate);
    socket.on('project:member_update', handleMemberUpdate);
    socket.on('project:file_update', handleFileUpdate);
    socket.on('project:announcement_update', handleAnnouncementUpdate);

    // Cleanup typing users periodically (stale typing indicators)
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        let changed = false;
        const next = { ...prev };
        Object.keys(next).forEach((uid) => {
          if (now - next[uid].timestamp > 6000) { // 6s threshold
            delete next[uid];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 3000);

    return () => {
      socket.emit('project:leave', { projectId });
      socket.off('chat:new', handleNewMessage);
      socket.off('project:typing', handleTyping);
      socket.off('project:stopTyping', handleStopTyping);
      socket.off('project:task_update', handleTaskUpdate);
      socket.off('project:milestone_update', handleMilestoneUpdate);
      socket.off('project:member_update', handleMemberUpdate);
      socket.off('project:file_update', handleFileUpdate);
      socket.off('project:announcement_update', handleAnnouncementUpdate);
      clearInterval(interval);
    };
  }, [socket, projectId, queryClient]);

  // Actions client can emit
  const emitTyping = (channel = 'general') => {
    if (socket && projectId) {
      socket.emit('project:typing', { projectId, channel });
    }
  };

  const emitStopTyping = (channel = 'general') => {
    if (socket && projectId) {
      socket.emit('project:stopTyping', { projectId, channel });
    }
  };

  return {
    typingUsers: Object.values(typingUsers),
    emitTyping,
    emitStopTyping,
    isConnected: !!socket?.connected,
  };
};
