import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.userId || user?._id || user?.id;
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const queryClient = useQueryClient();

  // eslint-disable-next-line react-hooks/purity
  const lastPongRef = useRef(Date.now());
  const heartbeatIntervalRef = useRef(null);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setConnected(false);
      setConnecting(false);
      return;
    }

    const token = localStorage.getItem('token');
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    setConnecting(true);

    // Setup Socket.IO client with custom reconnect parameters (Exponential Backoff)
    const newSocket = io(socketUrl, {
      auth: cb => cb({ token: localStorage.getItem('token') }),
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000, // max backoff of 10s
      randomizationFactor: 0.5,
      timeout: 20000
    });

    newSocket.on('connect', () => {
      setConnected(true);
      setConnecting(false);
      lastPongRef.current = Date.now();
      console.log('🔌 Socket connected successfully:', newSocket.id);
    });

    newSocket.on('disconnect', (reason) => {
      setConnected(false);
      setConnecting(false);
      console.warn('🔌 Socket disconnected. Reason:', reason);
      if (reason === 'io server disconnect') {
        // server kicked us, reconnect manually
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (err) => {
      setConnected(false);
      setConnecting(true);
      console.warn('🔌 Socket connection error:', err.message);
    });

    newSocket.on('reconnect_attempt', (attempt) => {
      setConnecting(true);
      newSocket.auth.token = localStorage.getItem('token');
      console.log(`🔌 Socket reconnection attempt #${attempt}`);
    });

    newSocket.on('reconnect_failed', () => {
      setConnected(false);
      setConnecting(false);
      console.error('🔌 Socket reconnection failed completely');
    });

    // Custom Heartbeat Listener
    newSocket.on('pong', () => {
      lastPongRef.current = Date.now();
    });

    // Custom Heartbeat Loop: Ping every 20s. Missed 3 pongs (60s) = Disconnect/Offline.
    lastPongRef.current = Date.now();
    heartbeatIntervalRef.current = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('ping');
        
        const missedTime = Date.now() - lastPongRef.current;
        if (missedTime > 60000) {
          console.warn('🔌 Heartbeat Hook: 3 pings missed. Connection dead. Forcefully reconnecting...');
          newSocket.disconnect();
          newSocket.connect();
        }
      }
    }, 20000);

    // Listen for new real-time notifications
    newSocket.on('notification:new', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      
      // Real-time UI Toast Alert
      toast((t) => (
        <div className="flex items-start gap-3 text-left">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-650 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
            {notification.actorId?.firstName?.charAt(0) || 'N'}
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-black text-slate-900">{notification.title}</p>
            <p className="text-[10px] text-slate-500 font-semibold leading-normal">{notification.message}</p>
          </div>
        </div>
      ), { duration: 4000 });

      // Invalidate count and list queries
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    // Listen for real-time unread count updates
    newSocket.on('notification:count', ({ count }) => {
      queryClient.setQueryData(['unreadCount'], { count });
    });

    // Listen for notification updates
    newSocket.on('notification:update', (updatedNotification) => {
      setNotifications((prev) => 
        prev.map(n => n._id === updatedNotification._id ? { ...n, ...updatedNotification } : n)
      );
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    });

    // Listen for notification deletes
    newSocket.on('notification:delete', (deletedId) => {
      setNotifications((prev) => prev.filter(n => n._id !== deletedId));
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    });

    // Listen for new messages
    newSocket.on('message:new', (message) => {
      queryClient.invalidateQueries({ queryKey: ['messages', message.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    newSocket.on('message:received', (message) => {
      queryClient.invalidateQueries({ queryKey: ['messages', message.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    // Listen for message updates (edits, reactions, deletes)
    newSocket.on('message:update', (updatedMessage) => {
      queryClient.invalidateQueries({ queryKey: ['messages', updatedMessage.conversationId] });
    });

    // Listen for read receipts
    newSocket.on('message:read', ({ conversationId, readBy }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    newSocket.on('message:delivered', ({ conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    newSocket.on('message:seen', ({ conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    // Listen for typing signals
    newSocket.on('typing:start', ({ conversationId, userId }) => {
      window.dispatchEvent(new CustomEvent('typing:start', { detail: { conversationId, userId } }));
    });

    newSocket.on('typing:stop', ({ conversationId, userId }) => {
      window.dispatchEvent(new CustomEvent('typing:stop', { detail: { conversationId, userId } }));
    });

    // Listen for avatar / profile updates
    newSocket.on('avatar:update', ({ userId, profileImage }) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    });

    newSocket.on('profile:update', ({ userId, profileImage, fullName }) => {
      queryClient.setQueryData(['conversations'], (old) => {
        if (!old) return old;
        return old.map(c => {
          if (c.otherParticipant && (c.otherParticipant._id === userId || c.otherParticipant._id?.toString() === userId?.toString())) {
            return {
              ...c,
              otherParticipant: {
                ...c.otherParticipant,
                profileImage: profileImage || c.otherParticipant.profileImage,
                fullName: fullName || c.otherParticipant.fullName
              }
            };
          }
          return c;
        });
      });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    });

    // Listen for profile updates after Google Scholar sync completes
    newSocket.on('profileUpdated', ({ userId }) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    });

    // Listen for Google Scholar import/sync completion events
    newSocket.on('scholarImported', ({ userId }) => {
      queryClient.invalidateQueries({ queryKey: ['scholarProfile'] });
    });

    newSocket.on('scholarSyncCompleted', ({ userId }) => {
      queryClient.invalidateQueries({ queryKey: ['scholarProfile'] });
    });

    // Listen for conversation sidebar lists updates
    newSocket.on('conversation:update', ({ conversationId, lastMessage }) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    setSocket(newSocket);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      newSocket.disconnect();
    };
  }, [userId]);

  // Reset notifications on logout
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket, connected, connecting, notifications, setNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};