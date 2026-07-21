/**
 * Formats a lastSeen timestamp to a user-friendly relative string.
 * e.g., "Last seen just now", "Last seen 3 minutes ago", "Last seen today at 11:38 AM", "Last seen Monday", "Last seen 12 July"
 */
export const formatLastSeen = (dateString) => {
  if (!dateString) return 'Offline';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Offline';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) {
    return 'Last seen just now';
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `Last seen ${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (compareDate.getTime() === today.getTime()) {
    return `Last seen today at ${timeStr}`;
  } else if (compareDate.getTime() === yesterday.getTime()) {
    return `Last seen yesterday at ${timeStr}`;
  }

  // Within the last 7 days
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  if (compareDate.getTime() > oneWeekAgo.getTime()) {
    const weekdayStr = date.toLocaleDateString([], { weekday: 'long' });
    return `Last seen ${weekdayStr} at ${timeStr}`;
  }

  // Older than 7 days
  const dayStr = date.getDate();
  const monthStr = date.toLocaleString([], { month: 'long' });
  if (date.getFullYear() === now.getFullYear()) {
    return `Last seen ${dayStr} ${monthStr}`;
  } else {
    return `Last seen ${dayStr} ${monthStr} ${date.getFullYear()}`;
  }
};

/**
 * Formats a message timestamp into a group date separator name (e.g. "Today", "Yesterday", or "July 10, 2026").
 */
export const getGroupDateString = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (compareDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (compareDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
};
