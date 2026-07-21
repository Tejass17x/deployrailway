import axiosInstance from '../../../api/axiosInstance';

class FollowService {
  async followUser(researcherId) {
    return await axiosInstance.post(`/v1/follows/${researcherId}`);
  }

  async unfollowUser(researcherId) {
    return await axiosInstance.delete(`/v1/follows/${researcherId}`);
  }

  async getFollowers(username, params = {}) {
    return await axiosInstance.get(`/v1/follows/followers/${username}`, { params });
  }

  async getFollowing(username, params = {}) {
    return await axiosInstance.get(`/v1/follows/following/${username}`, { params });
  }

  async getFollowSuggestions(params = {}) {
    return await axiosInstance.get('/v1/follows/suggestions', { params });
  }

  async getFollowStatus(researcherId) {
    return await axiosInstance.get(`/v1/follows/status/${researcherId}`);
  }

  async getMutualFollowers(username, params = {}) {
    return await axiosInstance.get(`/v1/follows/mutual/${username}`, { params });
  }
}

export default new FollowService();
