import axiosInstance from '../../../api/axiosInstance';

class ConnectionsService {
  async sendConnectionRequest(researcherId, note = '') {
    return await axiosInstance.post(`/v1/connections/request/${researcherId}`, { note });
  }

  async acceptConnectionRequest(requestId) {
    return await axiosInstance.patch(`/v1/connections/accept/${requestId}`);
  }

  async rejectConnectionRequest(requestId) {
    return await axiosInstance.patch(`/v1/connections/reject/${requestId}`);
  }

  async withdrawConnectionRequest(requestId) {
    return await axiosInstance.patch(`/v1/connections/withdraw/${requestId}`);
  }

  async removeConnection(connectionId) {
    return await axiosInstance.delete(`/v1/connections/remove/${connectionId}`);
  }

  async getConnections(params = {}) {
    return await axiosInstance.get('/v1/connections', { params });
  }

  async getUserConnections(username, params = {}) {
    return await axiosInstance.get(`/v1/connections/user/${username}`, { params });
  }

  async getReceivedRequests() {
    return await axiosInstance.get('/v1/connections/requests/received');
  }

  async getSentRequests() {
    return await axiosInstance.get('/v1/connections/requests/sent');
  }

  async getConnectionStatus(researcherId) {
    return await axiosInstance.get(`/v1/connections/status/${researcherId}`);
  }
}

export default new ConnectionsService();
