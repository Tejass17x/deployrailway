import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import projectService from '../services/project.service';
import { toast } from 'react-hot-toast';

export const useTaskBoard = (projectId) => {
  const queryClient = useQueryClient();

  // 1. Fetch Kanban columns and tasks
  const { data: board = {}, isLoading, error, refetch } = useQuery({
    queryKey: ['project:kanban', projectId],
    queryFn: async () => {
      if (!projectId) return {};
      const res = await projectService.getKanbanBoard(projectId);
      return res.data; // { backlog: [], todo: [], 'in-progress': [], 'in-review': [], done: [], cancelled: [] }
    },
    enabled: !!projectId,
    staleTime: 10000, // short cache for active board
  });

  // 2. Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (taskData) => projectService.createTask(projectId, taskData),
    onSuccess: (res) => {
      toast.success('Task created successfully.');
      queryClient.invalidateQueries({ queryKey: ['project:kanban', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project:taskCounts', projectId] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create task.');
    },
  });

  // 3. Update task status mutation (drag and drop status change)
  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) => projectService.updateTaskStatus(projectId, taskId, status),
    onMutate: async ({ taskId, status }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['project:kanban', projectId] });
      const previousBoard = queryClient.getQueryData(['project:kanban', projectId]);

      queryClient.setQueryData(['project:kanban', projectId], (old) => {
        if (!old) return old;
        const next = { ...old };
        let foundTask = null;

        // Remove from old column
        Object.keys(next).forEach((col) => {
          const index = next[col].findIndex((t) => t._id === taskId);
          if (index > -1) {
            [foundTask] = next[col].splice(index, 1);
          }
        });

        // Add to new column
        if (foundTask) {
          foundTask.status = status;
          if (!next[status]) next[status] = [];
          next[status].push(foundTask);
        }

        return next;
      });

      return { previousBoard };
    },
    onError: (err, variables, context) => {
      // Rollback
      if (context?.previousBoard) {
        queryClient.setQueryData(['project:kanban', projectId], context.previousBoard);
      }
      toast.error(err.message || 'Failed to move task.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['project:kanban', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project:taskCounts', projectId] });
    },
  });

  // 4. Reorder tasks mutation
  const reorderMutation = useMutation({
    mutationFn: ({ status, orderedIds }) => projectService.reorderTasks(projectId, status, orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project:kanban', projectId] });
    },
  });

  // 5. Update task details mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }) => projectService.updateTask(projectId, taskId, data),
    onSuccess: () => {
      toast.success('Task updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['project:kanban', projectId] });
    },
  });

  // 6. Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => projectService.deleteTask(projectId, taskId),
    onSuccess: () => {
      toast.success('Task deleted.');
      queryClient.invalidateQueries({ queryKey: ['project:kanban', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project:taskCounts', projectId] });
    },
  });

  // 7. Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: ({ taskId, content }) => projectService.addTaskComment(projectId, taskId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project:kanban', projectId] });
    },
  });

  return {
    board,
    isLoading,
    error,
    refetch,
    createTask: createTaskMutation.mutateAsync,
    updateTaskStatus: updateStatusMutation.mutateAsync,
    reorderTasks: reorderMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
    addTaskComment: addCommentMutation.mutateAsync,
    isCreating: createTaskMutation.isPending,
  };
};
