// Mock data for legacy messaging components
// These are fallback values used by the old messaging UI components

export const CURRENT_USER = {
  _id: 'current-user',
  firstName: 'You',
  lastName: '',
  fullName: 'You',
  email: '',
  profileImage: '',
  profileSlug: '',
};

export const MOCK_USERS = [
  {
    _id: 'mock-user-1',
    firstName: 'Sarah',
    lastName: 'Chen',
    fullName: 'Sarah Chen',
    profileImage: '',
    profileSlug: 'sarah-chen',
    isOnline: true,
    lastSeen: new Date(),
  },
  {
    _id: 'mock-user-2',
    firstName: 'James',
    lastName: 'Wilson',
    fullName: 'James Wilson',
    profileImage: '',
    profileSlug: 'james-wilson',
    isOnline: false,
    lastSeen: new Date(Date.now() - 3600000),
  },
];

export const SARAH_AUTO_REPLIES = [
  'That sounds great! Let me think about it.',
  'Interesting point. I\'ll look into that.',
  'Thanks for sharing! This is very relevant to my work.',
  'I agree. We should discuss this further.',
  'Let me check my schedule and get back to you.',
];

// Utility functions used by messaging components
export const formatLastSeen = (date) => {
  if (!date) return 'Unknown';
  const now = new Date();
  const lastSeen = new Date(date);
  const diffMs = now - lastSeen;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return lastSeen.toLocaleDateString();
};

export const formatConvTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const msgDate = new Date(date);
  const diffDays = Math.floor((now - msgDate) / 86400000);

  if (diffDays === 0) {
    return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return msgDate.toLocaleDateString([], { weekday: 'short' });
  }
  return msgDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const formatMsgTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};
