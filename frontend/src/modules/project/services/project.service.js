import axiosInstance from '../../../api/axiosInstance';

const projectService = {
  // ─── Projects ──────────────────────────────────────────────────────────────
  listProjects: (params) => axiosInstance.get('/v1/projects', { params }),
  createProject: (data) => axiosInstance.post('/v1/projects', data),
  getRecommendedProjects: () => axiosInstance.get('/v1/projects/recommended'),
  getTrendingProjects: () => axiosInstance.get('/v1/projects/trending'),
  getMyProjects: (params) => axiosInstance.get('/v1/projects/my', { params }),
  getOwnerStats: () => axiosInstance.get('/v1/projects/stats/owner'),
  getOwnerAnalytics: () => axiosInstance.get('/v1/projects/analytics/owner'),
  getBookmarkedProjects: (params) => axiosInstance.get('/v1/projects/bookmarks', { params }),
  
  getProject: (idOrSlug) => axiosInstance.get(`/v1/projects/${idOrSlug}`),
  updateProject: (id, data) => axiosInstance.put(`/v1/projects/${id}`, data),
  updateProjectStatus: (id, status) => axiosInstance.patch(`/v1/projects/${id}/status`, { status }),
  updateProjectProgress: (id, progress) => axiosInstance.patch(`/v1/projects/${id}/progress`, { progress }),
  archiveProject: (id) => axiosInstance.patch(`/v1/projects/${id}/archive`),
  deleteProject: (id) => axiosInstance.delete(`/v1/projects/${id}`),
  
  toggleBookmark: (id, type = 'bookmark') => axiosInstance.patch(`/v1/projects/${id}/bookmark`, { type }),
  getBookmarkStatus: (id) => axiosInstance.get(`/v1/projects/${id}/bookmark-status`),

  // ─── Analytics ─────────────────────────────────────────────────────────────
  getProjectDashboardAnalytics: (projectId) => axiosInstance.get(`/v1/projects/${projectId}/analytics`),
  getProjectActivityTimeline: (projectId, params) => axiosInstance.get(`/v1/projects/${projectId}/analytics/activity`, { params }),

  // ─── Team Members ──────────────────────────────────────────────────────────
  listMembers: (projectId, params) => axiosInstance.get(`/v1/projects/${projectId}/members`, { params }),
  getMyPermissions: (projectId) => axiosInstance.get(`/v1/projects/${projectId}/members/my-permissions`),
  leaveProject: (projectId) => axiosInstance.patch(`/v1/projects/${projectId}/members/leave`),
  assignMemberRole: (projectId, userId, role) => axiosInstance.patch(`/v1/projects/${projectId}/members/role`, { userId, role }),
  updateMemberPermissions: (projectId, userId, permissions) => axiosInstance.patch(`/v1/projects/${projectId}/members/permissions`, { userId, permissions }),
  removeMember: (projectId, memberId) => axiosInstance.delete(`/v1/projects/${projectId}/members/${memberId}`),
  suspendMember: (projectId, userId, reason) => axiosInstance.patch(`/v1/projects/${projectId}/members/suspend`, { userId, reason }),
  reinstateMember: (projectId, userId) => axiosInstance.patch(`/v1/projects/${projectId}/members/reinstate`, { userId }),
  transferOwnership: (projectId, newOwnerId) => axiosInstance.patch(`/v1/projects/${projectId}/members/transfer-ownership`, { newOwnerId }),

  // ─── Applications ──────────────────────────────────────────────────────────
  applyToProject: (projectId, data) => axiosInstance.post(`/v1/projects/${projectId}/applications`, data),
  listApplications: (projectId, params) => axiosInstance.get(`/v1/projects/${projectId}/applications`, { params }),
  getApplicationCounts: (projectId) => axiosInstance.get(`/v1/projects/${projectId}/applications/counts`),
  getApplicationDetails: (projectId, applicationId) => axiosInstance.get(`/v1/projects/${projectId}/applications/${applicationId}`),
  withdrawApplication: (projectId) => axiosInstance.patch(`/v1/projects/${projectId}/applications/withdraw`),
  
  reviewApplication: (projectId, applicationId, note) => axiosInstance.patch(`/v1/projects/${projectId}/applications/${applicationId}/review`, { note }),
  shortlistApplication: (projectId, applicationId, note) => axiosInstance.patch(`/v1/projects/${projectId}/applications/${applicationId}/shortlist`, { note }),
  scheduleInterview: (projectId, applicationId, interviewData) => axiosInstance.patch(`/v1/projects/${projectId}/applications/${applicationId}/interview`, interviewData),
  acceptApplication: (projectId, applicationId, role) => axiosInstance.patch(`/v1/projects/${projectId}/applications/${applicationId}/accept`, { role }),
  rejectApplication: (projectId, applicationId, reason) => axiosInstance.patch(`/v1/projects/${projectId}/applications/${applicationId}/reject`, { reason }),
  
  getMyApplications: (params) => axiosInstance.get('/v1/projects/applications/mine', { params }),

  // ─── Invitations ───────────────────────────────────────────────────────────
  sendInvitation: (projectId, userId, role, message) => axiosInstance.post(`/v1/projects/${projectId}/invitations`, { userId, role, message }),
  listInvitations: (projectId, params) => axiosInstance.get(`/v1/projects/${projectId}/invitations`, { params }),
  cancelInvitation: (projectId, invitationId) => axiosInstance.patch(`/v1/projects/${projectId}/invitations/${invitationId}/cancel`),
  getMyInvitations: (params) => axiosInstance.get('/v1/projects/invitations/mine', { params }),
  acceptInvitation: (invitationId) => axiosInstance.patch(`/v1/projects/invitations/${invitationId}/accept`),
  rejectInvitation: (invitationId, reason) => axiosInstance.patch(`/v1/projects/invitations/${invitationId}/reject`, { reason }),

  // ─── Tasks (Kanban) ────────────────────────────────────────────────────────
  listTasks: (projectId, params) => axiosInstance.get(`/v1/projects/${projectId}/tasks`, { params }),
  getKanbanBoard: (projectId) => axiosInstance.get(`/v1/projects/${projectId}/tasks/kanban`),
  getTaskCounts: (projectId) => axiosInstance.get(`/v1/projects/${projectId}/tasks/counts`),
  createTask: (projectId, data) => axiosInstance.post(`/v1/projects/${projectId}/tasks`, data),
  reorderTasks: (projectId, status, orderedIds) => axiosInstance.patch(`/v1/projects/${projectId}/tasks/reorder`, { status, orderedIds }),
  getTaskDetails: (projectId, taskId) => axiosInstance.get(`/v1/projects/${projectId}/tasks/${taskId}`),
  updateTask: (projectId, taskId, data) => axiosInstance.put(`/v1/projects/${projectId}/tasks/${taskId}`, data),
  updateTaskStatus: (projectId, taskId, status) => axiosInstance.patch(`/v1/projects/${projectId}/tasks/${taskId}/status`, { status }),
  addTaskComment: (projectId, taskId, content) => axiosInstance.post(`/v1/projects/${projectId}/tasks/${taskId}/comments`, { content }),
  deleteTask: (projectId, taskId) => axiosInstance.delete(`/v1/projects/${projectId}/tasks/${taskId}`),

  // ─── Milestones ────────────────────────────────────────────────────────────
  listMilestones: (projectId) => axiosInstance.get(`/v1/projects/${projectId}/milestones`),
  createMilestone: (projectId, data) => axiosInstance.post(`/v1/projects/${projectId}/milestones`, data),
  updateMilestone: (projectId, milestoneId, data) => axiosInstance.put(`/v1/projects/${projectId}/milestones/${milestoneId}`, data),
  completeMilestone: (projectId, milestoneId) => axiosInstance.patch(`/v1/projects/${projectId}/milestones/${milestoneId}/complete`),
  deleteMilestone: (projectId, milestoneId) => axiosInstance.delete(`/v1/projects/${projectId}/milestones/${milestoneId}`),

  // ─── Files ─────────────────────────────────────────────────────────────────
  listFiles: (projectId, params) => axiosInstance.get(`/v1/projects/${projectId}/files`, { params }),
  listFolders: (projectId) => axiosInstance.get(`/v1/projects/${projectId}/files/folders`),
  uploadFile: (projectId, formData) => axiosInstance.post(`/v1/projects/${projectId}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadFile: (projectId, fileId) => axiosInstance.get(`/v1/projects/${projectId}/files/${fileId}/download`),
  deleteFile: (projectId, fileId) => axiosInstance.delete(`/v1/projects/${projectId}/files/${fileId}`),

  // ─── Chat / Messaging ──────────────────────────────────────────────────────
  sendMessage: (projectId, data) => axiosInstance.post(`/v1/projects/${projectId}/messages`, data),
  listMessages: (projectId, params) => axiosInstance.get(`/v1/projects/${projectId}/messages`, { params }),
  listPinnedMessages: (projectId) => axiosInstance.get(`/v1/projects/${projectId}/messages/pinned`),
  getMessageThread: (projectId, messageId) => axiosInstance.get(`/v1/projects/${projectId}/messages/${messageId}/thread`),
  togglePinMessage: (projectId, messageId) => axiosInstance.patch(`/v1/projects/${projectId}/messages/${messageId}/pin`),
  reactToMessage: (projectId, messageId, emoji) => axiosInstance.patch(`/v1/projects/${projectId}/messages/${messageId}/react`, { emoji }),
  editMessage: (projectId, messageId, content) => axiosInstance.patch(`/v1/projects/${projectId}/messages/${messageId}`, { content }),
  deleteMessage: (projectId, messageId) => axiosInstance.delete(`/v1/projects/${projectId}/messages/${messageId}`),
  markMessageAsRead: (projectId, messageId) => axiosInstance.patch(`/v1/projects/${projectId}/messages/${messageId}/read`),

  // ─── Announcements ─────────────────────────────────────────────────────────
  createAnnouncement: (projectId, data) => axiosInstance.post(`/v1/projects/${projectId}/announcements`, data),
  listAnnouncements: (projectId, params) => axiosInstance.get(`/v1/projects/${projectId}/announcements`, { params }),
  togglePinAnnouncement: (projectId, announcementId) => axiosInstance.patch(`/v1/projects/${projectId}/announcements/${announcementId}/pin`),
  markAnnouncementAsRead: (projectId, announcementId) => axiosInstance.patch(`/v1/projects/${projectId}/announcements/${announcementId}/read`),
  deleteAnnouncement: (projectId, announcementId) => axiosInstance.delete(`/v1/projects/${projectId}/announcements/${announcementId}`),
};

export default projectService;
