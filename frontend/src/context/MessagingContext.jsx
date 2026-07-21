import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { messagingApi } from '../services/messagingApi';
import { eventBus } from '../services/eventBus';
import { toast } from '../components/ui/Toaster';
import { CURRENT_USER } from '../data/mockData';

// ─── Context ─────────────────────────────────────────────────────────────────
const MessagingContext = createContext(null);

export function MessagingProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState(new Map());          // convId → Message[]
  const [messagesMeta, setMessagesMeta] = useState(new Map()); // convId → {page,hasMore,isLoadingMore,isLoading}
  const [typingUsers, setTypingUsers] = useState(new Map());   // convId → Set<userId>
  const [onlineUsers, setOnlineUsers] = useState(new Set(['user-me', 'user-sarah']));
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [blockedUsers, setBlockedUsers] = useState(new Set());

  // Ek ref bana ke rakho taaki SocketContext aasaani se read kar sake
  const activeConvIdRef = useRef(null);
  useEffect(() => { activeConvIdRef.current = activeConversationId; }, [activeConversationId]);

  // Typing auto-clear timers: key = `${convId}:${userId}`
  const typingTimersRef = useRef(new Map());

  // ── Purani chats (conversations) load karo ─────────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const convs = await messagingApi.getConversations();
      setConversations(convs);
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const createConversation = useCallback(async (participantId) => {
    const conversation = await messagingApi.createConversation(participantId);
    setConversations((prev) => [
      conversation,
      ...prev.filter((item) => item.id !== conversation.id),
    ]);
    setActiveConversationId(conversation.id);
    setMessages((prev) => {
      const next = new Map(prev);
      if (!next.has(conversation.id)) next.set(conversation.id, []);
      return next;
    });
    setMessagesMeta((prev) => {
      const next = new Map(prev);
      if (!next.has(conversation.id)) {
        next.set(conversation.id, { page: 0, hasMore: false, isLoadingMore: false, isLoading: false });
      }
      return next;
    });
    return conversation;
  }, []);

  // ── Koi chat select karo ─────────────────────────────────────────────────
  const selectConversation = useCallback(async (convId) => {
    setActiveConversationId(convId);

    // Unread count zero (0) kar do
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
    );
    messagingApi.markConversationRead?.(convId).catch(() => {});

    // Agar pehle se load nahi hain toh messages laao
    if (!messages.has(convId)) {
      setMessagesMeta((prev) => {
        const next = new Map(prev);
        next.set(convId, { page: 0, hasMore: false, isLoadingMore: false, isLoading: true });
        return next;
      });
      try {
        const { messages: msgs, hasMore } = await messagingApi.getMessages(convId, 0);
        setMessages((prev) => {
          const next = new Map(prev);
          next.set(convId, [...msgs].reverse()); // chronological order
          return next;
        });
        setMessagesMeta((prev) => {
          const next = new Map(prev);
          next.set(convId, { page: 0, hasMore, isLoadingMore: false, isLoading: false });
          return next;
        });
      } catch {
        toast.error('Failed to load messages');
        setMessagesMeta((prev) => {
          const next = new Map(prev);
          next.set(convId, { page: 0, hasMore: false, isLoadingMore: false, isLoading: false });
          return next;
        });
      }
    }
  }, [messages]);

  // ── Purane messages load karo (Infinite scroll) ─────────────────────────────────
  const loadMoreMessages = useCallback(async (convId) => {
    const meta = messagesMeta.get(convId);
    if (!meta || !meta.hasMore || meta.isLoadingMore) return;

    const nextPage = meta.page + 1;
    setMessagesMeta((prev) => {
      const next = new Map(prev);
      next.set(convId, { ...meta, isLoadingMore: true });
      return next;
    });

    try {
      const { messages: olderMsgs, hasMore } = await messagingApi.getMessages(convId, nextPage);
      setMessages((prev) => {
        const next = new Map(prev);
        next.set(convId, [...[...olderMsgs].reverse(), ...(prev.get(convId) || [])]);
        return next;
      });
      setMessagesMeta((prev) => {
        const next = new Map(prev);
        next.set(convId, { page: nextPage, hasMore, isLoadingMore: false, isLoading: false });
        return next;
      });
    } catch {
      toast.error('Failed to load older messages');
      setMessagesMeta((prev) => {
        const next = new Map(prev);
        next.set(convId, { ...meta, isLoadingMore: false });
        return next;
      });
    }
  }, [messagesMeta]);

  // ── Message bhejo (Pehle UI me dikhao, fir server pe bhejo) ────────────────────────────────────────
  const sendMessage = useCallback(async (convId, content, attachments = []) => {
    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      id: tempId,
      tempId,
      content,
      messageType: 'text',
      senderId: CURRENT_USER.id,
      senderName: CURRENT_USER.fullName,
      senderAvatarUrl: CURRENT_USER.avatarUrl,
      createdAt: new Date().toISOString(),
      readAt: null,
      attachments,
      pending: true,
    };

    // 1. Pehle apne UI me message chipka do (optimistic update)
    setMessages((prev) => {
      const next = new Map(prev);
      next.set(convId, [...(prev.get(convId) || []), tempMsg]);
      return next;
    });

    try {
      const realMsg = await messagingApi.sendMessage(convId, content, attachments);

      // 2. Server se confirm hone pe purana temp message asli wale se badal do
      setMessages((prev) => {
        const next = new Map(prev);
        next.set(
          convId,
          (prev.get(convId) || []).map((m) => (m.tempId === tempId ? realMsg : m))
        );
        return next;
      });

      // 3. Bahar chat list me aakhri message update karke list ko sort kar do
      setConversations((prev) =>
        [...prev.map((c) => {
          if (c.id !== convId) return c;
          return {
            ...c,
            lastMessage: {
              content: realMsg.content,
              timestamp: realMsg.createdAt,
              senderName: 'You',
            },
            unreadCount: 0,
          };
        })].sort(
          (a, b) =>
            new Date(b.lastMessage?.timestamp || 0) - new Date(a.lastMessage?.timestamp || 0)
        )
      );

      // 4. SocketContext ko batao ki auto-reply (bot wala message) shuru kare
      eventBus.emit('message:sent', { messageId: realMsg.id, convId });
    } catch (err) {
      // Send fail hone par temp message hata do
      setMessages((prev) => {
        const next = new Map(prev);
        next.set(convId, (prev.get(convId) || []).filter((m) => m.tempId !== tempId));
        return next;
      });

      toast.error('Message failed to send. Retry?', {
        retry: () => sendMessage(convId, content, attachments),
        persist: true,
      });
    }
  }, []);

  // ── Naya message aane par SocketContext isko call karega ───────────────
  const appendIncomingMessage = useCallback((convId, message) => {
    setMessages((prev) => {
      const next = new Map(prev);
      next.set(convId, [...(prev.get(convId) || []), message]);
      return next;
    });
    setConversations((prev) =>
      [...prev.map((c) => {
        if (c.id !== convId) return c;
        const isActive = convId === activeConvIdRef.current;
        return {
          ...c,
          lastMessage: {
            content: message.content,
            timestamp: message.createdAt,
            senderName: message.senderName,
          },
          unreadCount: isActive ? 0 : c.unreadCount + 1,
        };
      })].sort(
        (a, b) =>
          new Date(b.lastMessage?.timestamp || 0) - new Date(a.lastMessage?.timestamp || 0)
      )
    );
  }, []);

  // ── Message read hone par SocketContext isko call karega ─────────────────────────────
  const updateReadReceipt = useCallback((convId, messageId, readAt) => {
    setMessages((prev) => {
      const next = new Map(prev);
      next.set(
        convId,
        (prev.get(convId) || []).map((m) =>
          m.id === messageId ? { ...m, readAt } : m
        )
      );
      return next;
    });
  }, []);

  // ── Koi type kar raha hai toh SocketContext isko call karega ─────────────────────────
  const setUserTyping = useCallback((convId, userId, isTyping) => {
    const key = `${convId}:${userId}`;
    clearTimeout(typingTimersRef.current.get(key));

    if (isTyping) {
      // Auto-clear after 3 s in case the stop event is missed
      const tid = setTimeout(() => {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          const s = new Set(prev.get(convId) || []);
          s.delete(userId);
          next.set(convId, s);
          return next;
        });
      }, 3000);
      typingTimersRef.current.set(key, tid);
    } else {
      typingTimersRef.current.delete(key);
    }

    setTypingUsers((prev) => {
      const next = new Map(prev);
      const s = new Set(prev.get(convId) || []);
      if (isTyping) s.add(userId);
      else s.delete(userId);
      next.set(convId, s);
      return next;
    });
  }, []);

  // ── User online/offline hone par SocketContext isko call karega ───────────────────────────
  const setUserOnline = useCallback((userId, isOnline) => {
    setOnlineUsers((prev) => {
      const next = new Set(prev);
      if (isOnline) next.add(userId);
      else next.delete(userId);
      return next;
    });
    setConversations((prev) =>
      prev.map((c) => ({
        ...c,
        participants: c.participants.map((p) =>
          p.id === userId ? { ...p, isOnline } : p
        ),
      }))
    );
  }, []);

  // ── Chat delete karo (Sirf local state se) ─────────────────────────────────────
  const deleteConversation = useCallback((convId) => {
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    setMessages((prev) => {
      const next = new Map(prev);
      next.delete(convId);
      return next;
    });
    if (activeConvIdRef.current === convId) {
      setActiveConversationId(null);
    }
  }, []);

  // ── User ko block karo (Sirf local state me) ──────────────────────────────────────────────
  const toggleBlockUser = useCallback((userId) => {
    setBlockedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }, []);

  // ── Derived helpers ───────────────────────────────────────────────────────
  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ?? null;

  const getOtherParticipant = useCallback(
    (convId) => {
      const conv = conversations.find((c) => c.id === convId);
      if (!conv) return null;
      return conv.participants.find((p) => p.id !== CURRENT_USER.id) ?? null;
    },
    [conversations]
  );

  return (
    <MessagingContext.Provider
      value={{
        conversations,
        activeConversationId,
        activeConversation,
        messages,
        messagesMeta,
        typingUsers,
        onlineUsers,
        isLoadingConversations,
        loadConversations,
        createConversation,
        selectConversation,
        sendMessage,
        loadMoreMessages,
        appendIncomingMessage,
        updateReadReceipt,
        setUserTyping,
        setUserOnline,
        getOtherParticipant,
        searchQuery,
        setSearchQuery,
        deleteConversation,
        blockedUsers,
        toggleBlockUser,
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const ctx = useContext(MessagingContext);
  if (!ctx) throw new Error('useMessaging must be used within MessagingProvider');
  return ctx;
}
