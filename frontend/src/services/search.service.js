import axiosInstance from '../api/axiosInstance';

class SearchService {
  /**
   * Unified search — publications + authors
   */
  async search(params = {}) {
    const { data } = await axiosInstance.get('/v1/search', { params });
    return data;
  }

  /**
   * Search publications only
   */
  async searchPublications(params = {}) {
    const { data } = await axiosInstance.get('/v1/search/publications', { params });
    return data;
  }

  async searchProjects(params = {}) {
    const { data } = await axiosInstance.get('/v1/search/projects', { params });
    return data;
  }

  /**
   * Search authors only
   */
  async searchAuthors(params = {}) {
    const { data } = await axiosInstance.get('/v1/search/authors', { params });
    return data;
  }

  /**
   * Search researchers only
   */
  async searchResearchers(params = {}) {
    const { data } = await axiosInstance.get('/v1/search/researchers', { params });
    return data;
  }

  /**
   * Search keywords only
   */
  async searchKeywords(params = {}) {
    const { data } = await axiosInstance.get('/v1/search/keywords', { params });
    return data;
  }

  /**
   * Search institutions only
   */
  async searchInstitutions(params = {}) {
    const { data } = await axiosInstance.get('/v1/search/institutions', { params });
    return data;
  }

  /**
   * Search journals
   */
  async searchJournals(params = {}) {
    const { data } = await axiosInstance.get('/v1/search/journals', { params });
    return data;
  }

  /**
   * Search conferences
   */
  async searchConferences(params = {}) {
    const { data } = await axiosInstance.get('/v1/search/conferences', { params });
    return data;
  }

  /**
   * Live autocomplete suggestions
   */
  async getAutocomplete(q) {
    if (!q || q.trim().length < 2) return { publications: [], authors: [], journals: [], conferences: [], keywords: [] };
    const { data } = await axiosInstance.get('/v1/search/autocomplete', { params: { q } });
    return data?.data || {};
  }

  /**
   * Get trending queries and research areas
   */
  async getTrending() {
    const { data } = await axiosInstance.get('/v1/search/trending');
    return data?.data || {};
  }

  /**
   * Get authenticated user's search history
   */
  async getHistory() {
    const { data } = await axiosInstance.get('/v1/search/history');
    return data?.data || [];
  }

  /**
   * Save a search to history
   */
  async saveHistory(query, filters, resultCount, searchType) {
    await axiosInstance.post('/v1/search/history', { query, filters, resultCount, searchType });
  }

  /**
   * Clear search history (all or single entry)
   */
  async clearHistory(id = null) {
    await axiosInstance.delete('/v1/search/history', { params: id ? { id } : {} });
  }

  /**
   * Toggle favorite on a search history entry
   */
  async toggleFavorite(id) {
    const { data } = await axiosInstance.patch(`/v1/search/history/${id}/favorite`);
    return data?.data;
  }
}

export default new SearchService();
