import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import projectService from '../services/project.service';
import { toast } from 'react-hot-toast';

export const useProjectChat = (projectId) => {
  const queryClient = useQueryClient();

  // 1. Fetch messages
  const { data: messages = [], isLoading, error, refetch } = useQuery({
    queryKey: ['project:messages', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await projectService.listMessages(projectId, { limit: 100 });
      return res.data;
    },
    enabled: !!projectId,
    staleTime: 30000,
  });

  // 2. Fetch pinned messages
  const { data: pinnedMessages = [] } = useQuery({
    queryKey: ['project:messages:pinned', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await projectService.listPinnedMessages(projectId);
      return res.data;
    },
    enabled: !!projectId,
  });

  // 3. Send message mutation
  const sendMutation = useMutation({
    mutationFn: (messageData) => projectService.sendMessage(projectId, messageData),
    onSuccess: (newMsg) => {
      // Optimistically append message
      queryClient.setQueryData(['project:messages', projectId], (old) => {
        if (!old) return [newMsg.data];
        if (old.some((m) => m._id === newMsg.data._id)) return old;
        return [...old, newMsg.data];
      });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to send message.');
    },
  });

  // 4. Edit message mutation
  const editMutation = useMutation({
    mutationFn: ({ messageId, content }) => projectService.editMessage(projectId, messageId, content),
    onSuccess: (res) => {
      const updated = res.data;
      queryClient.setQueryData(['project:messages', projectId], (old) => {
        if (!old) return [];
        return old.map((m) => (m._id === updated._id ? { ...m, ...updated } : m));
      });
    },
  });

  // 5. Delete message mutation
  const deleteMutation = useMutation({
    mutationFn: (messageId) => projectService.deleteMessage(projectId, messageId),
    onSuccess: (res) => {
      const deleted = res.data;
      queryClient.setQueryData(['project:messages', projectId], (old) => {
        if (!old) return [];
        return old.map((m) => (m._id === deleted._id ? { ...m, ...deleted } : m));
      });
    },
  });

  // 6. Reaction mutation
  const reactMutation = useMutation({
    mutationFn: ({ messageId, emoji }) => projectService.reactToMessage(projectId, messageId, emoji),
    onSuccess: (res) => {
      const updated = res.data;
      queryClient.setQueryData(['project:messages', projectId], (old) => {
        if (!old) return [];
        return old.map((m) => (m._id === updated._id ? { ...m, ...updated } : m));
      });
    },
  });

  // 7. Pin message mutation
  const pinMutation = useMutation({
    mutationFn: (messageId) => projectService.togglePinMessage(projectId, messageId),
    onSuccess: (res) => {
      const updated = res.data;
      queryClient.setQueryData(['project:messages', projectId], (old) => {
        if (!old) return [];
        return old.map((m) => (m._id === updated._id ? { ...m, ...updated } : m));
      });
      queryClient.invalidateQueries({ queryKey: ['project:messages:pinned', projectId] });
    },
  });

  return {
    messages,
    pinnedMessages,
    isLoading,
    error,
    refetch,
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
    editMessage: editMutation.mutateAsync,
    deleteMessage: deleteMutation.mutateAsync,
    reactToMessage: reactMutation.mutateAsync,
    togglePinMessage: pinMutation.mutateAsync,
  };
};
