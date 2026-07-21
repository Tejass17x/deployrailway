import axiosInstance from '../api/axiosInstance';

class AnalyticsService {
  /**
   * Get full analytics summary for a single publication
   */
  async getPublicationAnalytics(publicationId) {
    const { data } = await axiosInstance.get(`/v1/publications/${publicationId}/analytics`);
    return data?.data || {};
  }

  /**
   * Get views timeline (day-by-day)
   * @param {string} publicationId
   * @param {string} period - 7d | 30d | 90d
   */
  async getViewsTimeline(publicationId, period = '30d') {
    const { data } = await axiosInstance.get(`/v1/publications/${publicationId}/analytics/views`, {
      params: { period }
    });
    return data?.data || {};
  }

  /**
   * Get downloads timeline (day-by-day)
   */
  async getDownloadsTimeline(publicationId, period = '30d') {
    const { data } = await axiosInstance.get(`/v1/publications/${publicationId}/analytics/downloads`, {
      params: { period }
    });
    return data?.data || {};
  }

  /**
   * Get profile-level aggregate analytics
   */
  async getProfileAnalytics(profileSlug) {
    const { data } = await axiosInstance.get(`/v1/publications/profile-analytics/${profileSlug}`);
    return data?.data || {};
  }
}

export default new AnalyticsService();
