import axiosInstance from '../../../api/axiosInstance';

class NotificationsService {
  /**
   * Get cursor paginated notifications
   * @param {object} params - query parameters like limit, cursor, type, isRead
   */
  async getNotifications(params = {}) {
    const res = await axiosInstance.get('/v1/notifications', { params });
    return res;
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount() {
    const res = await axiosInstance.get('/v1/notifications/unread-count');
    return res;
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId) {
    const res = await axiosInstance.patch(`/v1/notifications/${notificationId}/read`);
    return res;
  }

  /**
   * Mark all notifications as read
   */
  async markAllRead() {
    const res = await axiosInstance.patch('/v1/notifications/read-all');
    return res;
  }

  /**
   * Delete a single notification
   */
  async deleteNotification(notificationId) {
    const res = await axiosInstance.delete(`/v1/notifications/${notificationId}`);
    return res;
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications() {
    const res = await axiosInstance.delete('/v1/notifications/clear-all');
    return res;
  }

  /**
   * Update notification settings preference
   */
  async updateSettings(settings = {}) {
    const res = await axiosInstance.patch('/v1/notifications/settings', settings);
    return res;
  }

  /**
   * Client-side aggregate stats — no extra DB call.
   * Computes dashboard metric card values from an already-fetched notifications array.
   * @param {Array} notifications - normalized notification objects
   * @returns {{ total, unread, citations, readRatio }}
   */
  getStats(notifications = []) {
    const total     = notifications.length;
    const unread    = notifications.filter((n) => !n.isRead).length;
    const citations = notifications.filter(
      (n) => n.type === 'citation' || n.originalType?.startsWith('publication')
    ).length;
    const readRatio = total > 0 ? Math.round(((total - unread) / total) * 100) : 0;
    return { total, unread, citations, readRatio };
  }
}

export default new NotificationsService();
