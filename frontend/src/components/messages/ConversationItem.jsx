import { useMessaging } from '../../context/MessagingContext';
import { formatConvTime } from '../../data/mockData';
import Avatar from '../ui/Avatar';

export default function ConversationItem({ conversation, isActive, currentUserId, onClick, animDelay }) {
  const { onlineUsers } = useMessaging();
  
  let displayName, avatarUrl;
  let otherParticipant = null;

  if (conversation.isGroup) {
    displayName = conversation.groupName;
    otherParticipant = conversation.participants.find((p) => p.id !== currentUserId) || conversation.participants[0];
    avatarUrl = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=64&h=64&fit=crop&q=80';
  } else {
    otherParticipant = conversation.participants.find((p) => p.id !== currentUserId);
    if (!otherParticipant) return null;
    displayName = otherParticipant.fullName;
    avatarUrl = otherParticipant.avatarUrl;
  }

  const isOnline = otherParticipant ? onlineUsers.has(otherParticipant.id) : false;
  const timeStr = conversation.lastMessage ? formatConvTime(conversation.lastMessage.timestamp) : '';

  return (
    <div
      onClick={() => onClick(conversation.id)}
      className={`anim-conv-item conv-row flex items-center px-5 py-3.5 cursor-pointer relative overflow-hidden transition-all duration-200
        ${isActive ? 'conv-active-ribbon' : ''}`}
      style={{ animationDelay: `${animDelay}ms` }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar
          src={avatarUrl}
          name={displayName}
          size="lg"
          className={isActive ? 'ring-2 ring-[#2563EB] ring-offset-2 shadow-md shadow-blue-200' : 'ring-2 ring-transparent'}
          isOnline={!conversation.isGroup && isOnline}
        />
      </div>

      {/* Text Content */}
      <div className="flex-1 min-w-0 ml-3.5">
        <div className="flex justify-between items-baseline gap-2">
          <span className={`text-sm font-semibold truncate transition-colors
            ${isActive ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}>
            {displayName}
          </span>
          {timeStr && (
            <span className={`text-[10px] flex-shrink-0 font-medium
              ${conversation.unreadCount > 0 ? 'text-[#2563EB]' : 'text-[#94A3B8]'}`}>
              {timeStr}
            </span>
          )}
        </div>
        <p className={`text-xs truncate mt-0.5 transition-colors
          ${conversation.unreadCount > 0 ? 'text-[#2563EB] font-medium' : 'text-[#64748B]'}`}>
          {conversation.lastMessage ? conversation.lastMessage.content : 'No messages yet'}
        </p>
      </div>

      {/* Unread badge */}
      {conversation.unreadCount > 0 && (
        <div className="ml-2 flex-shrink-0">
          <span className="anim-badge-pop flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-gradient-to-br from-[#2563EB] to-[#4F46E5] text-white text-[10px] font-bold rounded-full shadow-sm shadow-blue-300">
            {conversation.unreadCount}
          </span>
        </div>
      )}
    </div>
  );
}
