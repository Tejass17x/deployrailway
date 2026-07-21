import axiosInstance from '../api/axiosInstance';

class ScholarService {
  async saveResearchIdentity(data) {
    return await axiosInstance.post('/v1/research-identity', data);
  }

  async startImport() {
    return await axiosInstance.post('/v1/scholar/import');
  }

  async reimport() {
    return await axiosInstance.post('/v1/scholar/reimport');
  }

  async syncScholar() {
    return await axiosInstance.post('/v1/scholar/sync');
  }

  async getProfile() {
    return await axiosInstance.get('/v1/scholar/profile');
  }

  async getPublications(params = {}) {
    return await axiosInstance.get('/v1/scholar/publications', { params });
  }

  async getCoauthors() {
    return await axiosInstance.get('/v1/scholar/coauthors');
  }

  async getCitations() {
    return await axiosInstance.get('/v1/scholar/citations');
  }

  async getAnalytics() {
    return await axiosInstance.get('/v1/scholar/analytics');
  }

  async getImportStatus() {
    return await axiosInstance.get('/v1/scholar/import-status');
  }

  async getImportStatusById(jobId) {
    return await axiosInstance.get(`/v1/scholar/import/status/${jobId}`);
  }
}

export default new ScholarService();
