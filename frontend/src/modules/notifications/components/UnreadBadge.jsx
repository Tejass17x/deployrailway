import React from 'react';
import { useQuery } from '@tanstack/react-query';
import notificationsService from '../services/notifications.service';

const UnreadBadge = ({ className = '' }) => {
  const { data } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      try {
        const res = await notificationsService.getUnreadCount();
        if (res && res.data !== undefined) {
          return res.data;
        }
        return { count: 0 };
      } catch (err) {
        return { count: 0 };
      }
    },
    refetchInterval: 60000 // Polling fallback in case sockets fail, for maximum durability
  });

  const count = data?.count || 0;

  if (count === 0) return null;

  return (
    <span className={`absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] font-black tracking-tight leading-none ${className}`}>
      {count > 99 ? '99+' : count}
    </span>
  );
};

export default UnreadBadge;
