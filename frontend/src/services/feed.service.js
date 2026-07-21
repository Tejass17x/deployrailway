import axiosInstance from '../api/axiosInstance';

class FeedService {
  async getFeed(page = 1, limit = 10) {
    return await axiosInstance.get(`/v1/feed?page=${page}&limit=${limit}`);
  }

  async getTrending(page = 1, limit = 10) {
    return await axiosInstance.get(`/v1/feed/trending?page=${page}&limit=${limit}`);
  }

  async getRecommended(page = 1, limit = 10) {
    return await axiosInstance.get(`/v1/feed/recommended?page=${page}&limit=${limit}`);
  }

  async getLatest(page = 1, limit = 10) {
    return await axiosInstance.get(`/v1/feed/latest?page=${page}&limit=${limit}`);
  }

  async getFollowingFeed(page = 1, limit = 10) {
    return await axiosInstance.get(`/v1/feed/following?page=${page}&limit=${limit}`);
  }

  async getPublicationById(id) {
    return await axiosInstance.get(`/v1/feed/publication/${id}`);
  }

  async toggleLike(publicationId) {
    return await axiosInstance.post('/v1/publication/like', { publicationId });
  }

  async toggleBookmark(publicationId, folderName = 'General', isPrivate = true) {
    return await axiosInstance.post('/v1/publication/bookmark', { publicationId, folderName, isPrivate });
  }

  async moveBookmark(publicationId, folderName) {
    return await axiosInstance.post('/v1/bookmark/move', { publicationId, folderName });
  }

  async getBookmarkFolders() {
    return await axiosInstance.get('/v1/bookmark/folders');
  }

  async addComment(publicationId, text, parentId = null) {
    return await axiosInstance.post('/v1/publication/comment', { publicationId, text, parentId });
  }

  async getComments(publicationId) {
    return await axiosInstance.get(`/v1/publication/${publicationId}/comments`);
  }

  async toggleLikeComment(commentId) {
    return await axiosInstance.post(`/v1/comment/${commentId}/like`);
  }

  async recordShare(publicationId, platform = 'internal') {
    return await axiosInstance.post('/v1/publication/share', { publicationId, platform });
  }

  async getQuestions(page = 1, limit = 10, search = '') {
    return await axiosInstance.get(`/v1/questions?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  }

  async getProjects(page = 1, limit = 10, search = '') {
    return await axiosInstance.get(`/v1/projects?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  }

  async getDatasets(page = 1, limit = 10, search = '') {
    return await axiosInstance.get(`/v1/datasets?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  }

  async getEvents(page = 1, limit = 10) {
    return await axiosInstance.get(`/v1/events?page=${page}&limit=${limit}`);
  }

  // Follow APIs
  async toggleFollow(userId) {
    return await axiosInstance.post(`/v1/follow/${userId}`);
  }

  async getSuggestedResearchers() {
    return await axiosInstance.get('/v1/suggested-researchers');
  }

  async getFollowingList() {
    return await axiosInstance.get('/v1/following');
  }

  async getFollowersList() {
    return await axiosInstance.get('/v1/followers');
  }

  // AI & Extra APIs
  async getSimilarPapers(id) {
    return await axiosInstance.get(`/v1/publication/${id}/similar`);
  }

  async requestFullText(publicationId) {
    return await axiosInstance.post('/v1/publication/request-full-text', { publicationId });
  }

  async getAiSummary(publicationId) {
    return await axiosInstance.post('/v1/publication/ai-summary', { publicationId });
  }

  async globalSearch(query = '', page = 1, limit = 10) {
    return await axiosInstance.get(`/v1/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
  }

  // ════════════════════════════════════
  // Phase 8 — Activity Feed APIs
  // ════════════════════════════════════

  async getActivityFeed({ cursor, limit = 20 } = {}) {
    const params = new URLSearchParams({ limit });
    if (cursor) params.set('cursor', cursor);
    return await axiosInstance.get(`/v1/feed/activity?${params}`);
  }

  async getActivityFeedFollowing({ cursor, limit = 20 } = {}) {
    const params = new URLSearchParams({ limit });
    if (cursor) params.set('cursor', cursor);
    return await axiosInstance.get(`/v1/feed/activity/following?${params}`);
  }

  async getActivityFeedTrending({ cursor, limit = 20, windowHours = 24 } = {}) {
    const params = new URLSearchParams({ limit, windowHours });
    if (cursor) params.set('cursor', cursor);
    return await axiosInstance.get(`/v1/feed/activity/trending?${params}`);
  }

  async getActivityFeedLatest({ cursor, limit = 20 } = {}) {
    const params = new URLSearchParams({ limit });
    if (cursor) params.set('cursor', cursor);
    return await axiosInstance.get(`/v1/feed/activity/latest?${params}`);
  }

  async getFeedSidebar() {
    return await axiosInstance.get('/v1/feed/sidebar');
  }

  async emitFeedEvent({ eventType, entityType, entityId, metadata = {} }) {
    return await axiosInstance.post('/v1/feed/event', { eventType, entityType, entityId, metadata });
  }

  async recordInteraction(eventId, interactionType) {
    return await axiosInstance.post('/v1/feed/interact', { eventId, interactionType });
  }

  async bookmarkFeedEvent(eventId) {
    return this.recordInteraction(eventId, 'bookmark');
  }

  async recommendFeedEvent(eventId) {
    return this.recordInteraction(eventId, 'like');
  }
}

export default new FeedService();
