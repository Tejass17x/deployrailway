import axiosInstance from '../../../api/axiosInstance';

const collaborationsService = {
  createCollaboration: (data) => axiosInstance.post('/v1/collaborations', data),
  getMyCollaborations: () => axiosInstance.get('/v1/collaborations'),
  getCollaborationBySlug: (slug) => axiosInstance.get(`/v1/collaborations/${slug}`),
  deleteCollaboration: (id) => axiosInstance.delete(`/v1/collaborations/${id}`),

  inviteMember: (id, data) => axiosInstance.post(`/v1/collaborations/${id}/invite`, data),
  acceptInvitation: (invId) => axiosInstance.patch(`/v1/collaborations/invitations/${invId}/accept`),
  rejectInvitation: (invId) => axiosInstance.patch(`/v1/collaborations/invitations/${invId}/reject`),

  createTask: (id, data) => axiosInstance.post(`/v1/collaborations/${id}/tasks`, data),
  updateTaskStatus: (id, taskId, status) => axiosInstance.patch(`/v1/collaborations/${id}/tasks/${taskId}`, { status }),

  addFile: (id, data) => axiosInstance.post(`/v1/collaborations/${id}/files`, data),
  createMeeting: (id, data) => axiosInstance.post(`/v1/collaborations/${id}/meetings`, data),
};

export default collaborationsService;
