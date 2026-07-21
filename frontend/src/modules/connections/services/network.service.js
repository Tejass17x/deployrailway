import axiosInstance from '../../../api/axiosInstance';

class NetworkService {
  async getOverview() {
    return await axiosInstance.get('/v1/network/overview');
  }

  async getConnections(params = {}) {
    return await axiosInstance.get('/v1/network/connections', { params });
  }

  async getFollowers(params = {}) {
    return await axiosInstance.get('/v1/network/followers', { params });
  }

  async getFollowing(params = {}) {
    return await axiosInstance.get('/v1/network/following', { params });
  }

  async getSuggestions(params = {}) {
    return await axiosInstance.get('/v1/network/suggestions', { params });
  }

  async getRequests() {
    return await axiosInstance.get('/v1/network/requests');
  }

  async connect(researcherId, note = '') {
    return await axiosInstance.post('/v1/network/connect', { researcherId, note });
  }

  async follow(researcherId) {
    return await axiosInstance.post('/v1/network/follow', { researcherId });
  }

  async unfollow(researcherId) {
    return await axiosInstance.post('/v1/network/unfollow', { researcherId });
  }

  async acceptRequest(requestId) {
    return await axiosInstance.post('/v1/network/accept', { requestId });
  }

  async rejectRequest(requestId) {
    return await axiosInstance.post('/v1/network/reject', { requestId });
  }

  async removeConnection(connectionId) {
    return await axiosInstance.delete(`/v1/network/remove/${connectionId}`);
  }

  async getMutual(userId) {
    return await axiosInstance.get(`/v1/network/mutual/${userId}`);
  }

  async search(params = {}) {
    return await axiosInstance.get('/v1/network/search', { params });
  }

  async getRecommendations() {
    return await axiosInstance.get('/v1/network/recommendations');
  }
}

export default new NetworkService();
