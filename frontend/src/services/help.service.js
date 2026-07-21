import axiosInstance from '../api/axiosInstance';

class HelpService {
  async submitContactRequest(data) {
    return await axiosInstance.post('/v1/help/contact', data);
  }

  async submitGrievanceReport(data) {
    return await axiosInstance.post('/v1/help/grievance', data);
  }

  async submitFeedback(data) {
    return await axiosInstance.post('/v1/help/feedback', data);
  }

  async getContactInfo() {
    return await axiosInstance.get('/v1/help/contact-info');
  }
}

export default new HelpService();
