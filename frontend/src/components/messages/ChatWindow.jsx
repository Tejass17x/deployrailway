import { useRef, useEffect, useLayoutEffect } from 'react';
import { useMessaging } from '../../context/MessagingContext';
import { MessageSkeleton } from './Skeletons';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { FlaskConical, BookOpen, MessageCircle, Users, Sparkles, ArrowRight, FileText, Atom, Globe } from 'lucide-react';

export default function ChatWindow() {
  const {
    activeConversationId,
    messages,
    messagesMeta,
    loadMoreMessages,
    typingUsers,
    getOtherParticipant,
    searchQuery
  } = useMessaging();

  const containerRef = useRef(null);
  const sentinelRef = useRef(null);
  const bottomRef = useRef(null);
  const previousScrollHeightRef = useRef(0);
  const isFirstLoadRef = useRef(true);
  const prevConvIdRef = useRef(null);

  const meta = messagesMeta.get(activeConversationId);
  let currentMessages = messages.get(activeConversationId) || [];
  
  if (searchQuery.trim()) {
    currentMessages = currentMessages.filter(m => 
      m.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const otherParticipant = getOtherParticipant(activeConversationId);
  const isTyping = typingUsers.get(activeConversationId)?.size > 0;

  // Jab bhi dusri chat khole, scroll reset karne ka logic
  useEffect(() => {
    if (activeConversationId !== prevConvIdRef.current) {
      isFirstLoadRef.current = true;
      prevConvIdRef.current = activeConversationId;
    }
  }, [activeConversationId]);

  // Purane messages load karne ke liye observer (Infinite Scroll)
  useEffect(() => {
    if (!sentinelRef.current || !activeConversationId || !meta?.hasMore || meta?.isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Naye messages laane se pehle current scroll height save kar lo
          if (containerRef.current) {
            previousScrollHeightRef.current = containerRef.current.scrollHeight;
          }
          loadMoreMessages(activeConversationId);
        }
      },
      { root: containerRef.current, threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [activeConversationId, meta, loadMoreMessages]);

  // Purane messages aane pe scroll wahi roko, ya naye message/first load pe bottom pe jao
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    if (meta?.isLoading) {
      // Data load ho raha hai, abhi kuch mat karo
      return;
    }

    if (isFirstLoadRef.current && currentMessages.length > 0) {
      // Pehli baar khulne par seedha neeche (bottom) scroll karo
      bottomRef.current?.scrollIntoView();
      isFirstLoadRef.current = false;
    } else if (meta?.isLoadingMore === false && previousScrollHeightRef.current > 0) {
      // Purane messages load ho chuke, ab scroll adjust kar do taaki jump na ho
      const newScrollHeight = containerRef.current.scrollHeight;
      containerRef.current.scrollTop += (newScrollHeight - previousScrollHeightRef.current);
      previousScrollHeightRef.current = 0; // Reset kar do
    } else if (previousScrollHeightRef.current === 0 && !meta?.isLoadingMore) {
      // Ek naya message aaya hai, seedha neeche bhej do
      // (Asli tareeka scroll event track karna hai, par abhi simple scroll to bottom use kar rahe hain)
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [currentMessages, meta?.isLoading, meta?.isLoadingMore]);


  if (!activeConversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden">

        {/* Ambient background blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 blur-3xl opacity-60 animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-60px] right-[-60px] w-64 h-64 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 blur-3xl opacity-50 animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-10 w-40 h-40 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 blur-2xl opacity-40 animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />

        {/* Floating orbit icons */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top-left floating icon */}
          <div className="absolute top-16 left-16 opacity-0" style={{ animation: 'floatIn 0.6s ease-out 0.2s forwards, floatY 3s ease-in-out 0.8s infinite' }}>
            <div className="w-11 h-11 rounded-2xl bg-white shadow-lg shadow-blue-100 border border-blue-50 flex items-center justify-center">
              <Atom size={20} className="text-[#2563EB]" />
            </div>
          </div>
          {/* Top-right floating icon */}
          <div className="absolute top-20 right-20 opacity-0" style={{ animation: 'floatIn 0.6s ease-out 0.4s forwards, floatY 3.5s ease-in-out 1s infinite' }}>
            <div className="w-11 h-11 rounded-2xl bg-white shadow-lg shadow-purple-100 border border-purple-50 flex items-center justify-center">
              <Globe size={20} className="text-[#4F46E5]" />
            </div>
          </div>
          {/* Bottom-left floating icon */}
          <div className="absolute bottom-24 left-24 opacity-0" style={{ animation: 'floatIn 0.6s ease-out 0.6s forwards, floatY 4s ease-in-out 1.2s infinite' }}>
            <div className="w-11 h-11 rounded-2xl bg-white shadow-lg shadow-indigo-100 border border-indigo-50 flex items-center justify-center">
              <FileText size={20} className="text-[#6366F1]" />
            </div>
          </div>
          {/* Bottom-right floating icon */}
          <div className="absolute bottom-20 right-16 opacity-0" style={{ animation: 'floatIn 0.6s ease-out 0.8s forwards, floatY 3.2s ease-in-out 1.4s infinite' }}>
            <div className="w-11 h-11 rounded-2xl bg-white shadow-lg shadow-cyan-100 border border-cyan-50 flex items-center justify-center">
              <Users size={20} className="text-[#0891B2]" />
            </div>
          </div>
          {/* Mid-left floating icon */}
          <div className="absolute top-1/2 left-10 -translate-y-1/2 opacity-0" style={{ animation: 'floatIn 0.6s ease-out 1s forwards, floatY 5s ease-in-out 1.6s infinite' }}>
            <div className="w-9 h-9 rounded-xl bg-white shadow-md shadow-blue-100 border border-blue-50 flex items-center justify-center">
              <FlaskConical size={16} className="text-[#2563EB]" />
            </div>
          </div>
          {/* Mid-right floating icon */}
          <div className="absolute top-1/3 right-10 opacity-0" style={{ animation: 'floatIn 0.6s ease-out 1.2s forwards, floatY 4.5s ease-in-out 1.8s infinite' }}>
            <div className="w-9 h-9 rounded-xl bg-white shadow-md shadow-purple-100 border border-purple-50 flex items-center justify-center">
              <Sparkles size={16} className="text-[#9333EA]" />
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-sm px-6" style={{ animation: 'fadeSlideUp 0.7s ease-out 0.1s both' }}>
          
          {/* Hero icon */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#2563EB] to-[#4F46E5] flex items-center justify-center shadow-2xl shadow-blue-300/50" style={{ animation: 'heroPop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.3s both' }}>
              <MessageCircle size={36} className="text-white" />
            </div>
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-3xl border-2 border-[#2563EB]/30 scale-110 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-0 rounded-3xl border border-[#4F46E5]/20 scale-125 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
          </div>

          {/* Heading */}
          <h2 className="text-xl font-bold text-[#0F172A] mb-2 tracking-tight" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.5s both' }}>
            Start a Conversation
          </h2>
          <p className="text-sm text-[#64748B] leading-relaxed mb-6" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.65s both' }}>
            Connect with fellow researchers, share datasets, cite publications, and collaborate in real time.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center mb-7" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.8s both' }}>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] bg-[#EEF2FF] px-3 py-1.5 rounded-full border border-blue-100">
              <FlaskConical size={12} /> Link Datasets
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#4F46E5] bg-[#EDE9FE] px-3 py-1.5 rounded-full border border-purple-100">
              <BookOpen size={12} /> Cite Publications
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#0891B2] bg-[#ECFEFF] px-3 py-1.5 rounded-full border border-cyan-100">
              <Users size={12} /> Group Chats
            </span>
          </div>

          {/* CTA hint */}
          <div className="flex items-center gap-2 text-xs text-[#94A3B8] font-medium" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.95s both' }}>
            <ArrowRight size={14} className="text-[#2563EB]" />
            <span>Select a conversation from the left to begin</span>
          </div>
        </div>

        <style>{`
          @keyframes floatIn {
            from { opacity: 0; transform: translateY(16px) scale(0.85); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes floatY {
            0%, 100% { transform: translateY(0px); }
            50%       { transform: translateY(-10px); }
          }
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes heroPop {
            from { opacity: 0; transform: scale(0.5); }
            to   { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-[#F8FAFC]">
      <div ref={containerRef} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">

        {/* Scroll Sentinel (Isse pata chalta hai ki upar pohoch gaye) */}
        <div ref={sentinelRef} className="h-1 w-full" />

        {meta?.isLoadingMore && (
          <div className="flex justify-center py-2">
            <span className="text-xs text-[#94A3B8] font-medium">Loading older messages...</span>
          </div>
        )}

        {meta?.isLoading ? (
          <MessageSkeleton />
        ) : (
          <>
            {/* Date Separator (Aaj ka din) */}
            <div className="flex items-center gap-4 py-2 anim-date-line" style={{ animationDelay: '200ms' }}>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#CBD5E1] to-transparent" />
              <span className="text-[10px] font-bold text-[#94A3B8] tracking-[0.15em] uppercase bg-[#F1F5F9] px-3 py-1 rounded-full border border-[#E2E8F0]">Today</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#CBD5E1] to-transparent" />
            </div>

            {currentMessages.length === 0 && searchQuery.trim() ? (
              <div className="flex flex-col items-center justify-center py-10 text-[#64748B]">
                <p className="text-sm">No messages found matching "{searchQuery}"</p>
              </div>
            ) : (
              currentMessages.map((msg, i) => (
                <MessageBubble
                  key={msg.tempId || msg.id}
                  message={msg}
                  animDelay={Math.min(300 + (i * 50), 800)}
                />
              ))
            )}
          </>
        )}

        {isTyping && otherParticipant && (
          <TypingIndicator avatarUrl={otherParticipant.avatarUrl} name={otherParticipant.fullName} />
        )}

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Quick Actions (Neeche wale buttons) */}
      <div className="flex gap-3 px-6 py-2.5 bg-white border-t border-[#E8EDF5] shrink-0">
        <button
          className="link-dataset-btn anim-link-btn flex items-center gap-2 text-[#64748B] hover:text-[#2563EB] text-xs font-semibold hover:bg-[#EEF2FF] px-3 py-1.5 rounded-lg transition-all duration-200 group"
          style={{ animationDelay: '700ms' }}
        >
          <FlaskConical size={14} className="link-dataset-icon group-hover:scale-110 transition-transform" />
          Link Dataset
        </button>
        <button
          className="cite-pub-btn anim-link-btn flex items-center gap-2 text-[#64748B] hover:text-[#4F46E5] text-xs font-semibold hover:bg-[#EDE9FE] px-3 py-1.5 rounded-lg transition-all duration-200 group"
          style={{ animationDelay: '780ms' }}
        >
          <BookOpen size={14} className="cite-pub-icon group-hover:scale-110 transition-transform" />
          Cite Publication
        </button>
      </div>
    </div>
  );
}
