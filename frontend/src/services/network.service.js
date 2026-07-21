import axiosInstance from '../api/axiosInstance'; // Path apne hisaab se check kar lena

class NetworkService {
  // Global network search
  async searchNetwork(query) {
    const { data } = await axiosInstance.get(`/network/search?q=${encodeURIComponent(query)}`);
    return data?.data || {};
  }

  // Send connection request
  async sendRequest(researcherId) {
    const { data } = await axiosInstance.post('/network/connect', { researcherId });
    return data;
  }

  // FIXED: Ab hum requestId aur userId dono bhej rahe hain taaki backend fail na ho
  async acceptRequest(id) {
    const { data } = await axiosInstance.post('/network/accept', { 
      requestId: id,
      userId: id 
    });
    return data;
  }

  // FIXED: Reject ke liye bhi same smart logic
  async rejectRequest(id) {
    const { data } = await axiosInstance.post('/network/reject', { 
      requestId: id,
      userId: id 
    });
    return data;
  }

  // Pending requests fetch karna
  async getPendingRequests() {
    const { data } = await axiosInstance.get('/network/requests');
    return data?.data || [];
  }
}

export default new NetworkService();