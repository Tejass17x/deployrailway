import axiosInstance from '../api/axiosInstance';

class CitationService {
  /**
   * Get all citation formats for a publication
   */
  async getAllCitations(publicationId) {
    const { data } = await axiosInstance.get(`/v1/publications/${publicationId}/citation`);
    return data?.data || {};
  }

  /**
   * Get a single citation format
   * @param {string} publicationId
   * @param {string} format - apa | mla | ieee | harvard | chicago | bibtex | ris | etc.
   */
  async getCitationByFormat(publicationId, format) {
    const { data } = await axiosInstance.get(`/v1/publications/${publicationId}/citation/${format}`);
    return data?.data || {};
  }

  /**
   * Track a citation event (copy, export, download)
   */
  async trackEvent(publicationId, format, eventType) {
    try {
      await axiosInstance.post(`/v1/publications/${publicationId}/citation/track`, { format, eventType });
    } catch {
      // Tracking failure should never block UI
    }
  }

  /**
   * Get citation usage stats
   */
  async getStats(publicationId) {
    const { data } = await axiosInstance.get(`/v1/publications/${publicationId}/citation/stats`);
    return data?.data || {};
  }
}

export default new CitationService();
