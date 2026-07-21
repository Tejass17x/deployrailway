import axiosInstance from '../../../api/axiosInstance';

class MessagesService {
  /**
   * Get list of conversations for current user
   */
  async getConversations() {
    const res = await axiosInstance.get('/v1/conversations');
    return res;
  }

  /**
   * Create or fetch a direct conversation with a participant
   */
  async createConversation(participantId) {
    const res = await axiosInstance.post('/v1/conversations', { participantId });
    return res;
  }

  /**
   * Get paginated messages of a conversation
   */
  async getMessages(conversationId, params = {}) {
    const res = await axiosInstance.get(`/v1/messages/${conversationId}`, { params });
    return res;
  }

  /**
   * Send a new message
   */
  async sendMessage(payload, content, attachments) {
    let body;
    if (typeof payload === 'object' && payload !== null) {
      body = payload;
    } else {
      body = { conversationId: payload, text: content, attachments };
    }
    const res = await axiosInstance.post('/v1/messages', body);
    return res;
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markAsRead(conversationId) {
    const res = await axiosInstance.patch('/v1/messages/read', { conversationId });
    return res;
  }

  async markConversationRead(conversationId) {
    return this.markAsRead(conversationId);
  }

  /**
   * Pin a conversation
   */
  async pinConversation(conversationId) {
    const res = await axiosInstance.patch(`/v1/conversations/${conversationId}/pin`);
    return res;
  }

  /**
   * Unpin a conversation
   */
  async unpinConversation(conversationId) {
    const res = await axiosInstance.patch(`/v1/conversations/${conversationId}/unpin`);
    return res;
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId) {
    const res = await axiosInstance.patch(`/v1/conversations/${conversationId}/archive`);
    return res;
  }

  /**
   * Restore/Unarchive a conversation
   */
  async restoreConversation(conversationId) {
    const res = await axiosInstance.patch(`/v1/conversations/${conversationId}/restore`);
    return res;
  }

  /**
   * Mute a conversation
   */
  async muteConversation(conversationId) {
    const res = await axiosInstance.patch(`/v1/conversations/${conversationId}/mute`);
    return res;
  }

  /**
   * Unmute a conversation
   */
  async unmuteConversation(conversationId) {
    const res = await axiosInstance.patch(`/v1/conversations/${conversationId}/unmute`);
    return res;
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId) {
    const res = await axiosInstance.delete(`/v1/conversations/${conversationId}`);
    return res;
  }

  /**
   * Edit a message text
   */
  async editMessage(messageId, text) {
    const res = await axiosInstance.patch(`/v1/messages/${messageId}`, { text });
    return res;
  }

  /**
   * Delete a message
   * @param {string} messageId 
   * @param {string} deleteType - 'everyone' or 'me'
   */
  async deleteMessage(messageId, deleteType = 'everyone') {
    const res = await axiosInstance.delete(`/v1/messages/${messageId}`, {
      data: { deleteType }
    });
    return res;
  }

  /**
   * Add a reaction to a message
   */
  async reactToMessage(messageId, reaction) {
    const res = await axiosInstance.post(`/v1/messages/${messageId}/react`, { reaction });
    return res;
  }

  /**
   * Upload an attachment file
   */
  async uploadAttachment(formData) {
    const res = await axiosInstance.post('/v1/messages/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res;
  }

  /**
   * Search messages across user's conversations
   */
  async searchMessages(query) {
    const res = await axiosInstance.get('/v1/search/messages', { params: { q: query } });
    return res;
  }

  /**
   * Search conversations
   */
  async searchConversations(query) {
    const res = await axiosInstance.get('/v1/search/conversations', { params: { q: query } });
    return res;
  }

  /**
   * Get all shared files across conversations
   */
  async getSharedFiles() {
    const res = await axiosInstance.get('/v1/messages/shared-files');
    return res;
  }

  /**
   * Create a group chat
   */
  async createGroup(name, description, participantIds = []) {
    const res = await axiosInstance.post('/v1/messages/group/create', { name, description, participantIds });
    return res;
  }

  /**
   * Invite members to group chat
   */
  async inviteToGroup(conversationId, participantIds = []) {
    const res = await axiosInstance.post('/v1/messages/group/invite', { conversationId, participantIds });
    return res;
  }

  /**
   * Start a call log
   */
  async startCall(payload) {
    const res = await axiosInstance.post('/v1/messages/call/start', payload);
    return res;
  }

  /**
   * End a call log
   */
  async endCall(callId, status) {
    const res = await axiosInstance.post('/v1/messages/call/end', { callId, status });
    return res;
  }

  /**
   * Get call history
   */
  async getCallHistory() {
    const res = await axiosInstance.get('/v1/messages/call/history');
    return res;
  }

  /**
   * Get pending connection requests
   */
  async getRequests() {
    const res = await axiosInstance.get('/v1/messages/requests');
    return res;
  }

  /**
   * Accept connection request
   */
  async acceptRequest(requestId) {
    const res = await axiosInstance.post('/v1/network/accept', { requestId });
    return res;
  }

  /**
   * Reject/Decline connection request
   */
  async rejectRequest(requestId) {
    const res = await axiosInstance.post('/v1/network/reject', { requestId });
    return res;
  }

  /**
   * Reject connection request
   */
  async rejectRequest(requestId) {
    const res = await axiosInstance.post('/v1/network/reject', { requestId });
    return res;
  }

  /**
   * Get messaging contacts — returns connections, followers, and following
   * each enriched with online status and existingConversationId.
   */
  async getContacts() {
    const res = await axiosInstance.get('/v1/messages/contacts');
    return res;
  }
}

export default new MessagesService();
