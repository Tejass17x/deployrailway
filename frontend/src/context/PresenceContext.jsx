import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';
import { useQueryClient } from '@tanstack/react-query';

const PresenceContext = createContext(null);

export const PresenceProvider = ({ children }) => {
  const { socket } = useSocket();
  const [presenceMap, setPresenceMap] = useState(new Map());
  const [ticker, setTicker] = useState(0);
  const queryClient = useQueryClient();

  // Minute-timer to force recalculation of relative dates (e.g. "Last seen 3 minutes ago")
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((t) => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Listen to socket presence events
  useEffect(() => {
    if (!socket) return;

    const handleUserOnline = ({ userId, device, browser, platform }) => {
      const userIdStr = userId.toString();
      setPresenceMap((prev) => {
        const next = new Map(prev);
        next.set(userIdStr, {
          isOnline: true,
          lastSeen: null,
          device: device || 'desktop',
          browser: browser || 'unknown',
          platform: platform || 'unknown'
        });
        return next;
      });

      // Update React Query conversations cache online status
      queryClient.setQueryData(['conversations'], (old) => {
        if (!old) return old;
        return old.map(c => {
          if (c.otherParticipant && (c.otherParticipant._id === userIdStr || c.otherParticipant._id?.toString() === userIdStr)) {
            return {
              ...c,
              otherParticipant: {
                ...c.otherParticipant,
                isOnline: true,
                lastSeen: null
              }
            };
          }
          return c;
        });
      });
    };

    const handleUserOffline = ({ userId, lastSeen }) => {
      const userIdStr = userId.toString();
      setPresenceMap((prev) => {
        const next = new Map(prev);
        const current = next.get(userIdStr) || {};
        next.set(userIdStr, {
          ...current,
          isOnline: false,
          lastSeen: lastSeen
        });
        return next;
      });

      // Update React Query conversations cache online status
      queryClient.setQueryData(['conversations'], (old) => {
        if (!old) return old;
        return old.map(c => {
          if (c.otherParticipant && (c.otherParticipant._id === userIdStr || c.otherParticipant._id?.toString() === userIdStr)) {
            return {
              ...c,
              otherParticipant: {
                ...c.otherParticipant,
                isOnline: false,
                lastSeen: lastSeen
              }
            };
          }
          return c;
        });
      });
    };

    const handlePresenceUpdate = ({ userId, status, lastSeen }) => {
      const userIdStr = userId.toString();
      const isOnline = status === 'online';
      
      setPresenceMap((prev) => {
        const next = new Map(prev);
        const current = next.get(userIdStr) || {};
        next.set(userIdStr, {
          ...current,
          isOnline,
          lastSeen: isOnline ? null : (lastSeen || current.lastSeen || new Date())
        });
        return next;
      });
    };

    socket.on('USER_ONLINE', handleUserOnline);
    socket.on('USER_OFFLINE', handleUserOffline);
    socket.on('presence:update', handlePresenceUpdate);

    return () => {
      socket.off('USER_ONLINE', handleUserOnline);
      socket.off('USER_OFFLINE', handleUserOffline);
      socket.off('presence:update', handlePresenceUpdate);
    };
  }, [socket, queryClient]);

  const getUserPresence = (userId) => {
    if (!userId) return { isOnline: false, lastSeen: null };
    const idStr = userId.toString();
    
    // Check if we already have detailed presence cached in state
    if (presenceMap.has(idStr)) {
      return presenceMap.get(idStr);
    }
    
    // Check fallback from React Query conversation list if available
    const conversations = queryClient.getQueryData(['conversations']) || [];
    const conv = conversations.find(
      c => c.otherParticipant && (c.otherParticipant._id === idStr || c.otherParticipant.id === idStr)
    );
    
    if (conv && conv.otherParticipant) {
      return {
        isOnline: !!conv.otherParticipant.isOnline,
        lastSeen: conv.otherParticipant.lastSeen || null
      };
    }

    return { isOnline: false, lastSeen: null };
  };

  return (
    <PresenceContext.Provider value={{ getUserPresence, ticker, presenceMap }}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
};
