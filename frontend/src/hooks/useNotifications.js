import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import notificationsService from '../modules/notifications/services/notifications.service';

// ── Time formatter ────────────────────────────────────────────────────────────
export const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date    = new Date(dateStr);
  const now     = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr  = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr  / 24);
  if (diffSec < 60)  return 'Just now';
  if (diffMin < 60)  return `${diffMin}m ago`;
  if (diffHr  < 24)  return `${diffHr}h ago`;
  if (diffDay === 1) return '1d ago';
  return `${diffDay}d ago`;
};

// ── Date group classifier ─────────────────────────────────────────────────────
const getDateGroup = (dateStr) => {
  if (!dateStr) return 'older';
  const date              = new Date(dateStr);
  const now               = new Date();
  const todayMidnight     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayMidnight = new Date(todayMidnight);
  yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);
  if (date >= todayMidnight)     return 'today';
  if (date >= yesterdayMidnight) return 'yesterday';
  return 'older';
};

// ── Backend → UI type normalizer ──────────────────────────────────────────────
const TYPE_MAP = {
  follow:      'follow',
  connection:  'collab',
  collab:      'collab',
  publication: 'citation',
  mention:     'mention',
  comment:     'mention',
  review:      'review',
  peer:        'review',
  system:      'system',
  citation:    'citation',
  message:     'message',
  project:     'project',
};

export const normalizeType = (type) => {
  if (!type) return 'system';
  const prefix = type.split('_')[0].toLowerCase();
  return TYPE_MAP[prefix] || 'system';
};

const ACTION_CONFIG = {
  citation: { primary: 'View Citation',   secondary: null },
  mention:  { primary: 'Reply Now',       secondary: 'View Thread' },
  review:   { primary: 'View Review',     secondary: 'Edit Submission' },
  system:   { primary: 'Learn More',      secondary: null },
};

// ── Single notification normalizer ────────────────────────────────────────────
const normalizeNotification = (n) => {
  if (!n) return null;
  const displayType = normalizeType(n.type);
  const config      = ACTION_CONFIG[displayType] || ACTION_CONFIG.system;
  const actorName   = n.actorId
    ? `${n.actorId.firstName || ''} ${n.actorId.lastName || ''}`.trim()
    : null;

  return {
    ...n,
    id:              n._id?.toString() || n.id,
    type:            displayType,
    originalType:    n.type,
    title:           n.title || (actorName ? `${actorName} — Notification` : 'New Notification'),
    description:     n.message || n.description || '',
    time:            formatTimeAgo(n.createdAt),
    dateGroup:       getDateGroup(n.createdAt),
    primaryAction:   config.primary,
    secondaryAction: config.secondary,
    highlights:      Array.isArray(n.metadata?.highlights) ? n.metadata.highlights : [],
    isRead:          !!n.isRead,
  };
};

// ── Raw data extractor (handles all backend response shapes) ──────────────────
const extractNotifArray = (data) => {
  if (!data)                                    return [];
  if (Array.isArray(data))                      return data;
  if (Array.isArray(data.notifications))        return data.notifications;
  if (Array.isArray(data.docs))                 return data.docs;
  if (data.data) {
    if (Array.isArray(data.data.notifications)) return data.data.notifications;
    if (Array.isArray(data.data.docs))          return data.data.docs;
    if (Array.isArray(data.data))               return data.data;
  }
  return [];
};

// ── Optimistic update helpers ─────────────────────────────────────────────────
const applyToArray = (arr, fn) => (Array.isArray(arr) ? fn(arr) : arr);

const updateNotifInData = (data, id, patch) => {
  const fn = (arr) => arr.map((n) => {
    const nId = n._id?.toString() || n.id;
    return nId === id ? { ...n, ...patch } : n;
  });
  if (!data)                      return data;
  if (Array.isArray(data))        return fn(data);
  if (data.notifications)         return { ...data, notifications: fn(data.notifications) };
  if (data.docs)                  return { ...data, docs: fn(data.docs) };
  if (data.data?.notifications)   return { ...data, data: { ...data.data, notifications: fn(data.data.notifications) } };
  if (data.data?.docs)            return { ...data, data: { ...data.data, docs: fn(data.data.docs) } };
  return data;
};

const updateAllNotifsInData = (data, patch) => {
  const fn = (arr) => arr.map((n) => ({ ...n, ...patch }));
  if (!data)                      return data;
  if (Array.isArray(data))        return fn(data);
  if (data.notifications)         return { ...data, notifications: fn(data.notifications) };
  if (data.docs)                  return { ...data, docs: fn(data.docs) };
  if (data.data?.notifications)   return { ...data, data: { ...data.data, notifications: fn(data.data.notifications) } };
  if (data.data?.docs)            return { ...data, data: { ...data.data, docs: fn(data.data.docs) } };
  return data;
};

const removeNotifFromData = (data, id) => {
  const fn = (arr) => arr.filter((n) => {
    const nId = n._id?.toString() || n.id;
    return nId !== id;
  });
  if (!data)                      return data;
  if (Array.isArray(data))        return fn(data);
  if (data.notifications)         return { ...data, notifications: fn(data.notifications) };
  if (data.docs)                  return { ...data, docs: fn(data.docs) };
  if (data.data?.notifications)   return { ...data, data: { ...data.data, notifications: fn(data.data.notifications) } };
  if (data.data?.docs)            return { ...data, data: { ...data.data, docs: fn(data.data.docs) } };
  return data;
};

// ── Main hook ─────────────────────────────────────────────────────────────────
export const useNotifications = () => {
  const queryClient = useQueryClient();

  // ── Queries ────────────────────────────────────────────────────────────────
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => notificationsService.getNotifications({ limit: 50 }),
    staleTime: 30_000,
    retry: 1,
  });

  const unreadCountQuery = useQuery({
    queryKey: ['unreadCount'],
    queryFn:  () => notificationsService.getUnreadCount(),
    staleTime: 15_000,
    retry: 1,
  });

  // ── Normalize ──────────────────────────────────────────────────────────────
  const notifications = useMemo(() => {
    const raw = extractNotifArray(notificationsQuery.data);
    return raw.map(normalizeNotification).filter(Boolean);
  }, [notificationsQuery.data]);

  // ── Live aggregate stats ───────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total     = notifications.length;
    const unreadRaw = notifications.filter((n) => !n.isRead).length;
    const citations = notifications.filter((n) => n.type === 'citation').length;
    const mentions  = notifications.filter((n) => n.type === 'mention').length;
    const reviews   = notifications.filter((n) => n.type === 'review').length;
    const system    = notifications.filter((n) => n.type === 'system').length;
    const messages  = notifications.filter((n) => n.type === 'message').length;
    const readRatio = total > 0 ? Math.round(((total - unreadRaw) / total) * 100) : 0;

    // Weekly bars — last 7 days
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyBars = [];
    for (let i = 6; i >= 0; i--) {
      const d   = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toDateString();
      const count = notifications.filter(
        (n) => n.createdAt && new Date(n.createdAt).toDateString() === str
      ).length;
      weeklyBars.push({ day: DAYS[d.getDay()], value: count });
    }

    // eslint-disable-next-line react-hooks/purity
    const oneWeekAgo   = new Date(Date.now() - 7 * 86_400_000);
    const weeklyNotifs = notifications.filter(
      (n) => n.createdAt && new Date(n.createdAt) >= oneWeekAgo
    );
    const weeklyReads     = weeklyNotifs.filter((n) => n.isRead).length;
    const weeklyCitations = weeklyNotifs.filter((n) => n.type === 'citation').length;

    // Prefer dedicated unread-count endpoint for accuracy
    const liveUnread =
      unreadCountQuery.data?.count        ??
      unreadCountQuery.data?.data?.count  ??
      unreadRaw;

    return { total, unread: liveUnread, citations, mentions, reviews, system, messages, readRatio, weeklyBars, weeklyReads, weeklyCitations };
  }, [notifications, unreadCountQuery.data]);

  // ── Date-grouped list ──────────────────────────────────────────────────────
  const dateGrouped = useMemo(() => {
    const today = [], yesterday = [], older = [];
    notifications.forEach((n) => {
      if      (n.dateGroup === 'today')     today.push(n);
      else if (n.dateGroup === 'yesterday') yesterday.push(n);
      else                                  older.push(n);
    });
    return { today, yesterday, older };
  }, [notifications]);

  // ── Mark single as read (optimistic) ──────────────────────────────────────
  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationsService.markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const snapshot = queryClient.getQueryData(['notifications']);
      queryClient.setQueryData(['notifications'], (old) => updateNotifInData(old, id, { isRead: true }));
      return { snapshot };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.snapshot) queryClient.setQueryData(['notifications'], ctx.snapshot);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  // ── Mark all as read (optimistic) ─────────────────────────────────────────
  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const snapshot = queryClient.getQueryData(['notifications']);
      queryClient.setQueryData(['notifications'], (old) => updateAllNotifsInData(old, { isRead: true }));
      queryClient.setQueryData(['unreadCount'], (old) =>
        old ? { ...old, count: 0, data: { ...(old.data || {}), count: 0 } } : { count: 0 }
      );
      return { snapshot };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snapshot) queryClient.setQueryData(['notifications'], ctx.snapshot);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  // ── Dismiss / delete notification (optimistic) ─────────────────────────────
  const dismissMutation = useMutation({
    mutationFn: (id) => notificationsService.deleteNotification(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const snapshot = queryClient.getQueryData(['notifications']);
      queryClient.setQueryData(['notifications'], (old) => removeNotifFromData(old, id));
      return { snapshot };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.snapshot) queryClient.setQueryData(['notifications'], ctx.snapshot);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  return {
    notifications,
    dateGrouped,
    stats,
    isLoading:           notificationsQuery.isLoading,
    isFetching:          notificationsQuery.isFetching,
    isError:             notificationsQuery.isError,
    markAsRead:          (id) => markAsReadMutation.mutate(id),
    markAllRead:         ()   => markAllReadMutation.mutate(),
    dismissNotification: (id) => dismissMutation.mutate(id),
    isMarkingAllRead:    markAllReadMutation.isPending,
    refetch:             notificationsQuery.refetch,
  };
};
