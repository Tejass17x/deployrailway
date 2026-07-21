import axiosInstance from '../api/axiosInstance';

class MessageService {
  async getConversations() {
    return await axiosInstance.get('/v1/messages/conversations');
  }

  async createConversation(participantId) {
    return await axiosInstance.post('/v1/messages/conversations', { participantId });
  }

  async getMessages(conversationId) {
    return await axiosInstance.get(`/v1/messages/conversations/${conversationId}/messages`);
  }

  async sendMessage(conversationId, content, attachments = []) {
    return await axiosInstance.post(`/v1/messages/conversations/${conversationId}/messages`, {
      content,
      attachments
    });
  }

  async markConversationRead(conversationId) {
    return await axiosInstance.post(`/v1/messages/conversations/${conversationId}/read`);
  }

  async getUnreadCount() {
    return await axiosInstance.get('/v1/messages/unread-count');
  }

  async deleteMessage(messageId) {
    return await axiosInstance.delete(`/v1/messages/${messageId}`);
  }
}

export default new MessageService();
