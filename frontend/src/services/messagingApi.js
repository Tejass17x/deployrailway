import axiosInstance from '../api/axiosInstance';
import { CURRENT_USER } from '../data/mockData';

const DEFAULT_AVATAR =
  'https://ui-avatars.com/api/?background=DBEAFE&color=2563EB&name=Researcher';

const profileCache = new Map();

const parseStoredJson = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const getCurrentUser = () => {
  const storedUser = parseStoredJson('user');
  const storedProfile = parseStoredJson('profile');
  const merged = { ...storedUser, ...storedProfile };
  const id = merged._id || merged.id || merged.user || CURRENT_USER.id;
  const fullName =
    merged.fullName ||
    [merged.firstName, merged.lastName].filter(Boolean).join(' ') ||
    CURRENT_USER.fullName;
  const avatarUrl =
    merged.profileImage ||
    merged.avatarUrl ||
    merged.avatar ||
    CURRENT_USER.avatarUrl;

  return {
    ...CURRENT_USER,
    ...merged,
    id: String(id),
    backendId: id ? String(id) : null,
    fullName,
    avatarUrl,
  };
};

const unwrap = (response) => response?.data ?? response;

const getPageDocs = (payload) => {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.docs)) return data.docs;
  return [];
};

const getPagination = (payload) => {
  const data = unwrap(payload);
  return {
    page: Number(data?.page || 1),
    totalPages: Number(data?.totalPages || 1),
  };
};

const makeAvatarUrl = (name) =>
  `https://ui-avatars.com/api/?background=DBEAFE&color=2563EB&name=${encodeURIComponent(name || 'Researcher')}`;

const normalizeUser = (user, currentUser = getCurrentUser()) => {
  if (!user) return currentUser;

  const rawId = user._id || user.id || user;
  const isCurrentUser = rawId && currentUser.backendId && String(rawId) === String(currentUser.backendId);
  const fullName =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    (isCurrentUser ? currentUser.fullName : 'Researcher');
  const avatarUrl =
    user.profileImage ||
    user.avatarUrl ||
    user.avatar ||
    (isCurrentUser ? currentUser.avatarUrl : makeAvatarUrl(fullName));

  const normalized = {
    id: isCurrentUser ? CURRENT_USER.id : String(rawId),
    backendId: rawId ? String(rawId) : null,
    fullName,
    avatarUrl,
    avatarUrlLg: avatarUrl,
    isOnline: false,
    institution: user.institution || user.organization || '',
    department: user.department || user.researcherType || '',
    positionTitle: user.positionTitle || user.role || 'Researcher',
    citationsCount: user.citationsCount || 0,
    hIndex: user.hIndex || 0,
    topPublications: user.topPublications || [],
    sharedProjects: user.sharedProjects || [],
  };

  if (normalized.backendId) profileCache.set(normalized.id, normalized);
  return normalized;
};

const normalizeAttachment = (attachment, index = 0) => {
  if (typeof attachment === 'string') {
    return {
      id: `att-${index}-${attachment}`,
      fileName: attachment.split('/').pop() || 'Attachment',
      fileSizeBytes: 0,
      fileType: 'application/octet-stream',
      cdnUrl: attachment,
    };
  }
  return {
    id: attachment.id || attachment._id || `att-${index}`,
    fileName: attachment.fileName || attachment.name || attachment.url || 'Attachment',
    fileSizeBytes: attachment.fileSizeBytes || attachment.size || 0,
    fileType: attachment.fileType || attachment.type || 'application/octet-stream',
    cdnUrl: attachment.cdnUrl || attachment.url || '#',
  };
};

const normalizeMessage = (message, currentUser = getCurrentUser()) => {
  const sender = normalizeUser(message.sender, currentUser);
  const senderId =
    message.senderId ||
    (String(message.sender?._id || message.sender || '') === String(currentUser.backendId)
      ? CURRENT_USER.id
      : sender.id);

  return {
    id: message._id || message.id,
    content: message.content || '',
    messageType: message.messageType || message.type || 'text',
    senderId,
    senderName: senderId === CURRENT_USER.id ? currentUser.fullName : sender.fullName,
    senderAvatarUrl: senderId === CURRENT_USER.id ? currentUser.avatarUrl : sender.avatarUrl,
    createdAt: message.createdAt || new Date().toISOString(),
    readAt: message.readAt || (message.readBy?.length ? message.updatedAt : null),
    attachments: (message.attachments || []).map(normalizeAttachment),
  };
};

const normalizeConversation = (conversation, currentUser = getCurrentUser()) => {
  const participants = (conversation.participants || []).map((participant) =>
    normalizeUser(participant, currentUser)
  );
  const hasCurrentUser = participants.some((participant) => participant.id === CURRENT_USER.id);

  if (!hasCurrentUser) {
    participants.unshift({
      ...currentUser,
      id: CURRENT_USER.id,
      isOnline: true,
    });
  }

  const lastMessage = conversation.lastMessage
    ? normalizeMessage(conversation.lastMessage, currentUser)
    : null;

  return {
    id: conversation._id || conversation.id,
    backendId: conversation._id || conversation.id,
    isGroup: conversation.type === 'group',
    groupName: conversation.title || 'Group chat',
    participants,
    lastMessage: lastMessage
      ? {
          content: lastMessage.content,
          timestamp: lastMessage.createdAt || conversation.lastMessageAt,
          senderName: lastMessage.senderName,
        }
      : null,
    unreadCount: conversation.unreadCount || 0,
  };
};

const toBackendAttachments = (attachments = []) =>
  attachments.map((attachment) => attachment.cdnUrl || attachment.url || attachment.fileName || String(attachment));

export const messagingApi = {
  async getConversations() {
    const response = await axiosInstance.get('/v1/messages/conversations', {
      params: { sort: '-lastMessageAt', limit: 50 },
    });
    const currentUser = getCurrentUser();
    return getPageDocs(response).map((conversation) => normalizeConversation(conversation, currentUser));
  },

  async createConversation(participantId) {
    const response = await axiosInstance.post('/v1/messages/conversations', { participantId });
    return normalizeConversation(unwrap(response), getCurrentUser());
  },

  async getMessages(convId, page = 0) {
    const response = await axiosInstance.get(`/v1/messages/conversations/${convId}/messages`, {
      params: {
        page: Number(page) + 1,
        limit: 25,
        sort: '-createdAt',
      },
    });
    const currentUser = getCurrentUser();
    const pagination = getPagination(response);
    const messages = getPageDocs(response).map((message) => normalizeMessage(message, currentUser));

    return {
      messages,
      hasMore: pagination.page < pagination.totalPages,
      page,
    };
  },

  async sendMessage(convId, content, attachments = []) {
    const response = await axiosInstance.post(`/v1/messages/conversations/${convId}/messages`, {
      content,
      attachments: toBackendAttachments(attachments),
    });
    return normalizeMessage(unwrap(response), getCurrentUser());
  },

  async markRead(messageId) {
    return { readAt: new Date().toISOString(), messageId };
  },

  async markConversationRead(convId) {
    const response = await axiosInstance.post(`/v1/messages/conversations/${convId}/read`);
    return unwrap(response);
  },

  async uploadFile(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post('/v1/profile/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (!progressEvent.total) return;
        onProgress?.(Math.round((progressEvent.loaded * 100) / progressEvent.total));
      },
    });

    const uploaded = unwrap(response);
    const url = uploaded?.url || uploaded?.secure_url || uploaded?.path || uploaded?.fileUrl;

    return {
      id: uploaded?._id || uploaded?.id || `att-${Date.now()}`,
      fileName: file.name,
      fileSizeBytes: file.size,
      fileType: file.type,
      cdnUrl: url || DEFAULT_AVATAR,
    };
  },

  async getUserProfile(userId) {
    return profileCache.get(userId) || {
      id: userId,
      fullName: 'Researcher',
      avatarUrl: DEFAULT_AVATAR,
      avatarUrlLg: DEFAULT_AVATAR,
      institution: '',
      department: '',
      positionTitle: 'Researcher',
      citationsCount: 0,
      hIndex: 0,
      topPublications: [],
      sharedProjects: [],
    };
  },

  async updatePresence(isOnline) {
    return { isOnline };
  },
};
