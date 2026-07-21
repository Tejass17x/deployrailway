import axiosInstance from '../api/axiosInstance';

class ProfileService {
  // Get public profile by slug
  async getPublicProfile(profileSlug) {
    return await axiosInstance.get(`/v1/profile/${profileSlug}`);
  }

  // Get own authenticated profile details
  async getProfile() {
    return await axiosInstance.get('/v1/profile/me');
  }

  // General profile update
  async updateProfile(data) {
    return await axiosInstance.patch('/v1/profile', data);
  }

  /**
   * Update cover banner — supports upload progress tracking.
   * @param {File|string} coverImageOrFile
   * @param {Function} onUploadProgress - Axios progress callback: (progressEvent) => void
   */
  async updateBanner(coverImageOrFile, onUploadProgress) {
    if (coverImageOrFile instanceof File) {
      const formData = new FormData();
      formData.append('file', coverImageOrFile);
      return await axiosInstance.patch('/v1/profile/banner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress
      });
    }
    return await axiosInstance.patch('/v1/profile/banner', { coverImage: coverImageOrFile });
  }

  /**
   * Update profile avatar — supports upload progress tracking.
   * @param {File|string} profileImageOrFile
   * @param {Function} onUploadProgress - Axios progress callback: (progressEvent) => void
   */
  async updateAvatar(profileImageOrFile, onUploadProgress) {
    if (profileImageOrFile instanceof File) {
      const formData = new FormData();
      formData.append('file', profileImageOrFile);
      return await axiosInstance.patch('/v1/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress
      });
    }
    return await axiosInstance.patch('/v1/profile/avatar', { profileImage: profileImageOrFile });
  }

  // Delete profile photo (removes from Cloudflare R2 + clears MongoDB)
  async deletePhoto() {
    return await axiosInstance.delete('/v1/profile/photo');
  }

  // Delete profile banner (removes from Cloudflare R2 + resets to default)
  async deleteBanner() {
    return await axiosInstance.delete('/v1/profile/banner');
  }

  async updateBasic(data) {
    return await axiosInstance.patch('/v1/profile/basic', data);
  }

  async updateAbout(data) {
    return await axiosInstance.patch('/v1/profile/about', data);
  }

  async updateSkills(skills) {
    return await axiosInstance.patch('/v1/profile/skills', { skills });
  }

  async updateResearch(data) {
    return await axiosInstance.patch('/v1/profile/research', data);
  }

  async updateEducation(education) {
    return await axiosInstance.patch('/v1/profile/education', { education });
  }

  async updateExperience(experience) {
    return await axiosInstance.patch('/v1/profile/experience', { experience });
  }

  async updateProjects(projects) {
    return await axiosInstance.patch('/v1/profile/projects', { projects });
  }

  async updateSocial(socialLinks) {
    return await axiosInstance.patch('/v1/profile/social', { socialLinks });
  }

  async updateMetrics(metrics) {
    return await axiosInstance.patch('/v1/profile/metrics', { metrics });
  }

  // Analytics endpoints
  async getAnalytics() {
    return await axiosInstance.get('/v1/profile/analytics');
  }

  async trackDownload() {
    return await axiosInstance.patch('/v1/profile/analytics/download');
  }

  // Google Scholar trigger sync
  async syncGoogleScholar() {
    return await axiosInstance.post('/v1/profile/google-scholar/sync');
  }

  // Upload any file (avatar/banner/etc.) — generic endpoint
  async uploadFile(formData, onUploadProgress) {
    return await axiosInstance.post('/v1/profile/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress
    });
  }

  // Soft delete account & profile
  async deleteProfile() {
    return await axiosInstance.delete('/v1/profile');
  }

  // Backward compatibility
  async getPublications() {
    return await axiosInstance.get('/v1/scholar/publications');
  }

  async getActivity() {
    return { success: true, data: [] };
  }

  async getResearchAreas() {
    return { success: true, data: [] };
  }

  async getKeywords() {
    return { success: true, data: [] };
  }
}

export default new ProfileService();
