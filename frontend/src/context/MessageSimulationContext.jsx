import { createContext, useContext, useEffect, useRef } from 'react';
import { useMessaging } from './MessagingContext';
import { eventBus } from '../services/eventBus';
import { MOCK_USERS, SARAH_AUTO_REPLIES } from '../data/mockData';

const SARAH = MOCK_USERS['user-sarah'];
const SARAH_ID = 'user-sarah';
const SARAH_CONV_ID = 'conv-1';

let _replyIdx = 0;
const getNextReply = () => SARAH_AUTO_REPLIES[_replyIdx++ % SARAH_AUTO_REPLIES.length];

const SocketContext = createContext({});

/**
 * SocketProvider
 * ─ Simulates real-time WebSocket events so the UI can be fully tested
 *   without a running backend.
 *
 * Simulated events:
 *  • Initial greeting from Sarah 4-6 s after conv-1 is first opened
 *  • Read receipt 2 s after user sends a message to conv-1
 *  • Typing indicator + auto-reply 3-7 s after each user message to conv-1
 *  • Sarah's online status toggles every 45 s
 *
 * When the real backend is wired up, replace this provider with one that
 * creates a STOMP client and forwards server events to the same context methods.
 */
export function SocketProvider({ children }) {
  const {
    setUserTyping,
    appendIncomingMessage,
    updateReadReceipt,
    setUserOnline,
    activeConversationId,
  } = useMessaging();

  // Collect setTimeout IDs so we can clear them on unmount
  const timerIds = useRef([]);
  const hasGreetedRef = useRef(false);

  const after = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timerIds.current.push(id);
    return id;
  };

  const makeMessage = (content) => ({
    id: `ws-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    content,
    messageType: 'text',
    senderId: SARAH_ID,
    senderName: SARAH.fullName,
    senderAvatarUrl: SARAH.avatarUrl,
    createdAt: new Date().toISOString(),
    readAt: null,
    attachments: [],
  });

  // ── Initial Sarah greeting when conv-1 is first selected ─────────────────
  useEffect(() => {
    if (activeConversationId !== SARAH_CONV_ID) return;
    if (hasGreetedRef.current) return;
    hasGreetedRef.current = true;

    // 4 s → Sarah starts typing
    after(() => setUserTyping(SARAH_CONV_ID, SARAH_ID, true), 4000);
    // 6.5 s → Sarah sends greeting message
    after(() => {
      setUserTyping(SARAH_CONV_ID, SARAH_ID, false);
      appendIncomingMessage(
        SARAH_CONV_ID,
        makeMessage(
          "I wanted to make sure you received the files okay. The CO2 capture rate data is on the second sheet of the Excel file."
        )
      );
    }, 6500);
  }, [activeConversationId, setUserTyping, appendIncomingMessage]);

  // ── Auto-reply every time the user sends to conv-1 ───────────────────────
  useEffect(() => {
    const unsub = eventBus.on('message:sent', ({ messageId, convId }) => {
      if (convId !== SARAH_CONV_ID) return;

      const typingDelay = 2800 + Math.random() * 1200;
      const replyDelay  = typingDelay + 2000 + Math.random() * 800;

      // 2 s → read receipt
      after(() => updateReadReceipt(convId, messageId, new Date().toISOString()), 2000);
      // typingDelay → start typing
      after(() => setUserTyping(SARAH_CONV_ID, SARAH_ID, true), typingDelay);
      // replyDelay → stop typing + send reply
      after(() => {
        setUserTyping(SARAH_CONV_ID, SARAH_ID, false);
        appendIncomingMessage(SARAH_CONV_ID, makeMessage(getNextReply()));
      }, replyDelay);
    });
    return unsub;
  }, [updateReadReceipt, setUserTyping, appendIncomingMessage]);

  // ── Presence toggle: Sarah goes offline / comes back every 45 s ──────────
  useEffect(() => {
    let sarahOnline = true;
    const interval = setInterval(() => {
      sarahOnline = !sarahOnline;
      setUserOnline(SARAH_ID, sarahOnline);
    }, 45_000);
    return () => clearInterval(interval);
  }, [setUserOnline]);

  // ── Clean up all pending timers on unmount ────────────────────────────────
  useEffect(() => {
    return () => timerIds.current.forEach(clearTimeout);
  }, []);

  return <SocketContext.Provider value={{}}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
