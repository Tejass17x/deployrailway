import { useQuery } from '@tanstack/react-query';
import projectService from '../services/project.service';
import { useAuth } from '../../../context/AuthContext';

export const useProjectPermissions = (projectId) => {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['project:permissions', projectId, user?._id],
    queryFn: async () => {
      if (!projectId || !user) return null;
      const res = await projectService.getMyPermissions(projectId);
      return res.data;
    },
    enabled: !!projectId && !!user,
    staleTime: 60000, // cache for 1 minute
  });

  const role = data?.role || null;
  const isSuspended = data?.status === 'suspended';
  
  // Effective permissions preset merged with overrides
  const permissions = data?.effectivePermissions || {
    canEditProject: false,
    canManageMembers: false,
    canManageApplications: false,
    canManageTasks: false,
    canManageFiles: false,
    canManageMilestones: false,
    canManageAnnouncements: false,
    canManageMeetings: false,
    canSendMessages: false,
    canViewAnalytics: false,
    canDeleteProject: false,
    canTransferOwnership: false,
  };

  // If suspended, restrict active operations
  const canSendMessages = permissions.canSendMessages && !isSuspended;
  const canManageTasks = permissions.canManageTasks && !isSuspended;
  const canManageFiles = permissions.canManageFiles && !isSuspended;

  return {
    role,
    isSuspended,
    permissions: {
      ...permissions,
      canSendMessages,
      canManageTasks,
      canManageFiles,
    },
    isOwner: role === 'principal-investigator',
    isLoading,
    error,
  };
};
