import { useEffect } from 'react';
import { useMessaging } from '../../context/MessagingContext';
import { ConversationSkeleton } from './Skeletons';
import ConversationItem from './ConversationItem';
import { CURRENT_USER } from '../../data/mockData';
import { MessageSquare } from 'lucide-react';

export default function ConversationsList() {
  const {
    conversations,
    activeConversationId,
    selectConversation,
    isLoadingConversations,
    loadConversations
  } = useMessaging();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return (
    <section className="w-full h-full flex flex-col">
      {/* Header */}
      <div
        className="anim-conv-header px-5 py-5 border-b border-[#E8EDF5] flex items-center gap-3 flex-shrink-0 group hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        style={{ animationDelay: '30ms' }}
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#4F46E5] flex items-center justify-center shadow-sm shadow-blue-200 group-hover:shadow-blue-300 group-hover:scale-105 transition-all duration-300">
          <MessageSquare size={15} className="text-white group-hover:-rotate-12 transition-transform duration-300" />
        </div>
        <h2 className="font-bold text-lg text-[#0F172A] tracking-tight group-hover:text-[#2563EB] transition-colors">Messages</h2>
        {conversations.length > 0 && (
          <span className="ml-auto text-[11px] font-bold text-[#2563EB] bg-[#EEF2FF] px-2 py-0.5 rounded-full group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-300 shadow-sm">
            {conversations.length}
          </span>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingConversations ? (
          <>
            <ConversationSkeleton />
            <ConversationSkeleton />
            <ConversationSkeleton />
          </>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center anim-fade-up">
            <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] flex items-center justify-center mb-4">
              <MessageSquare size={24} className="text-[#4F46E5]" />
            </div>
            <p className="text-sm font-semibold text-[#0F172A]">No conversations yet</p>
            <p className="text-xs text-[#94A3B8] mt-1">Start a new chat with a researcher</p>
          </div>
        ) : (
          conversations.map((conv, i) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={activeConversationId === conv.id}
              currentUserId={CURRENT_USER.id}
              onClick={selectConversation}
              animDelay={i * 70}
            />
          ))
        )}
      </div>
    </section>
  );
}
