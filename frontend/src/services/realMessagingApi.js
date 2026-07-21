import { apiClient } from './apiClient';

/**
 * Real API integration for the messaging system.
 * Swap out the mock `messagingApi.js` for this when your backend team is ready.
 */
export const realMessagingApi = {
  
  /** GET /conversations - Fetch all conversations for the logged-in user */
  async getConversations() {
    const response = await apiClient.get('/conversations');
    return response.data; 
  },

  /** GET /conversations/:id/messages?page=N - Fetch paginated messages */
  async getMessages(convId, page = 0) {
    const response = await apiClient.get(`/conversations/${convId}/messages`, {
      params: { page }
    });
    return response.data; // { messages: [], hasMore: boolean }
  },

  /** POST /messages - Send a new text message */
  async sendMessage(convId, content, attachments = []) {
    const response = await apiClient.post(`/messages`, {
      conversationId: convId,
      content,
      attachments,
      messageType: 'text'
    });
    return response.data;
  },

  /** PATCH /messages/:id/read - Mark message as read */
  async markRead(messageId) {
    const response = await apiClient.patch(`/messages/${messageId}/read`);
    return response.data;
  },

  /** POST /upload - Upload file to backend (which sends to Cloudflare R2) */
  async uploadFile(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onProgress) onProgress(percentCompleted);
      }
    });
    
    // Returns attachment metadata with Cloudflare R2 URL
    return response.data; 
  },

  /** GET /users/:id - Fetch researcher profile */
  async getUserProfile(userId) {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  }
};
