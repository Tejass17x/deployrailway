import { useState, useRef, useEffect } from 'react';
import { Video, Phone, MoreVertical, ArrowLeft, User, Search, BellOff, Bell, Ban, Trash2, X, Pencil, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMessaging } from '../../context/MessagingContext';
import { formatLastSeen } from '../../data/mockData';
import { toast } from '../ui/Toaster';
import Avatar from '../ui/Avatar';

export default function ChatHeader() {
  const { activeConversation, getOtherParticipant, typingUsers, onlineUsers, selectConversation, searchQuery, setSearchQuery, deleteConversation, blockedUsers, toggleBlockUser } = useMessaging();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const menuRef = useRef(null);
  const editInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  if (!activeConversation) return null;

  const otherParticipant = getOtherParticipant(activeConversation.id);
  const isTyping = typingUsers.get(activeConversation.id)?.size > 0;
  const isBlocked = otherParticipant ? blockedUsers.has(otherParticipant.id) : false;
  
  let title = '', avatarUrl = '', statusText = '', showOnlineDot = false;

  if (activeConversation.isGroup) {
    title = activeConversation.groupName;
    avatarUrl = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=64&h=64&fit=crop&q=80';
    statusText = isTyping ? 'Someone is typing…' : `${activeConversation.participants.length} members`;
  } else if (otherParticipant) {
    title = otherParticipant.fullName;
    avatarUrl = otherParticipant.avatarUrl;
    const isOnline = onlineUsers.has(otherParticipant.id);
    if (isTyping) {
      statusText = 'Typing…';
    } else if (isOnline) {
      statusText = 'Active Now';
      showOnlineDot = true;
    } else {
      statusText = `Last seen ${formatLastSeen(otherParticipant.lastSeen)}`;
    }
  }

  if (showSearch) {
    return (
      <header className="anim-header-reveal flex-shrink-0 h-[72px] px-6 flex items-center justify-between bg-white border-b border-[#E2E8F0] z-10 relative">
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#2563EB]/20 to-transparent" />
        <div className="flex-1 flex items-center bg-[#F8FAFC] rounded-xl px-4 py-2.5 border border-[#E2E8F0] anim-fade-up">
           <Search size={18} className="text-[#94A3B8] mr-3" />
           <input 
             type="text" 
             autoFocus 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder="Search in conversation..." 
             className="flex-1 bg-transparent outline-none text-sm text-[#0F172A]" 
           />
           <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="p-1 hover:bg-[#E2E8F0] rounded-full text-[#64748B] transition-colors">
             <X size={16} />
           </button>
        </div>
      </header>
    );
  }

  return (
    <header className="anim-header-reveal flex-shrink-0 h-[72px] px-6 flex items-center justify-between bg-white border-b border-[#E2E8F0] z-10 relative">
      {/* Subtle gradient underline */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#2563EB]/20 to-transparent" />

      {/* Left: Back (mobile) + Avatar + Edit button + Name */}
      <div className="flex items-center gap-2 anim-slide-up-stagger" style={{ animationDelay: '80ms' }}>
        {/* Back button */}
        <button 
          onClick={() => selectConversation(null)}
          className="p-2 -ml-2 rounded-xl text-[#64748B] hover:bg-[#EEF2FF] hover:text-[#2563EB] transition-colors"
          aria-label="Back to conversations"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Avatar */}
        <div
          className="cursor-pointer group flex-shrink-0"
          onClick={() => !activeConversation.isGroup && otherParticipant?.id && navigate(`/profile/${otherParticipant.slug || otherParticipant.profileSlug || otherParticipant.username || otherParticipant.id}`)}
        >
          <Avatar
            src={avatarUrl}
            name={title}
            size="md"
            className="ring-2 ring-[#DBEAFE] group-hover:ring-[#2563EB] shadow-sm transition-colors duration-300"
            isOnline={showOnlineDot}
          />
        </div>

        {/* Edit pencil button — always visible on desktop */}
        <button
          aria-label="Edit chat"
          onClick={() => {
            setIsEditingTitle(true);
            setEditedTitle(title);
            setTimeout(() => editInputRef.current?.focus(), 50);
          }}
          className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#2563EB] hover:bg-[#EEF2FF] transition-all duration-200 flex-shrink-0"
          title="Edit chat name"
        >
          <Pencil size={15} />
        </button>

        {/* Title / Inline Rename */}
        <div>
          {isEditingTitle ? (
            <form
              className="flex items-center gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                setIsEditingTitle(false);
                toast.success('Chat name updated');
              }}
            >
              <input
                ref={editInputRef}
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-sm font-bold text-[#0F172A] border-b-2 border-[#2563EB] bg-transparent outline-none w-40"
                onBlur={() => setIsEditingTitle(false)}
              />
              <button type="submit" className="p-1 rounded-full hover:bg-[#DCFCE7] text-[#22C55E] transition-colors">
                <Check size={14} />
              </button>
            </form>
          ) : (
            <div
              className="cursor-pointer group"
              onClick={() => !activeConversation.isGroup && otherParticipant?.id && navigate(`/profile/${otherParticipant.slug || otherParticipant.profileSlug || otherParticipant.username || otherParticipant.id}`)}
            >
              <h3 className="text-sm font-bold text-[#0F172A] leading-tight group-hover:text-[#2563EB] transition-colors duration-300">{title}</h3>
              <p className={`text-xs font-medium flex items-center gap-1.5 mt-0.5
                ${showOnlineDot ? 'text-[#22C55E]' : isTyping ? 'text-[#4F46E5]' : 'text-[#94A3B8]'}`}>
                {showOnlineDot && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] inline-block" />
                )}
                {isTyping ? (
                  <span className="flex items-center gap-1">
                    Typing
                    <span className="flex items-center gap-[3px] ml-0.5">
                      <span className="w-1 h-1 rounded-full bg-[#4F46E5] typing-dot" />
                      <span className="w-1 h-1 rounded-full bg-[#4F46E5] typing-dot" />
                      <span className="w-1 h-1 rounded-full bg-[#4F46E5] typing-dot" />
                    </span>
                  </span>
                ) : statusText}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-1 anim-slide-up-stagger" style={{ animationDelay: '180ms' }}>
        <button
          aria-label="Video call"
          onClick={() => toast.info('Video calling feature coming soon')}
          className="btn-icon-ripple w-10 h-10 rounded-full flex items-center justify-center text-[#64748B] hover:text-[#2563EB] hover:bg-[#EEF2FF] transition-all duration-300 hover:scale-110 hover:shadow-sm group"
        >
          <Video className="w-[18px] h-[18px] group-hover:rotate-12 transition-transform duration-300" />
        </button>
        <button
          aria-label="Voice call"
          onClick={() => toast.info('Voice calling feature coming soon')}
          className="btn-icon-ripple w-10 h-10 rounded-full flex items-center justify-center text-[#64748B] hover:text-[#2563EB] hover:bg-[#EEF2FF] transition-all duration-300 hover:scale-110 hover:shadow-sm group"
        >
          <Phone className="w-[18px] h-[18px] group-hover:rotate-12 transition-transform duration-300" />
        </button>
        
        {/* More Options Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="More options"
            className="btn-icon-ripple w-10 h-10 rounded-full flex items-center justify-center text-[#64748B] hover:text-[#2563EB] hover:bg-[#EEF2FF] transition-all duration-300 hover:scale-110 hover:shadow-sm group"
          >
            <MoreVertical className="w-[18px] h-[18px] group-hover:rotate-12 transition-transform duration-300" />
          </button>
          
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-[#E2E8F0] py-2 z-50 anim-fade-up">
              <button 
                onClick={() => { 
                  setIsMenuOpen(false); 
                  if (otherParticipant?.id) navigate(`/profile/${otherParticipant.slug || otherParticipant.profileSlug || otherParticipant.username || otherParticipant.id}`);
                }}
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center gap-3 transition-colors"
              >
                <User size={16} className="text-[#94A3B8]" /> View Profile
              </button>
              <button 
                onClick={() => { 
                  setIsMenuOpen(false); 
                  setShowSearch(true);
                }}
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center gap-3 transition-colors"
              >
                <Search size={16} className="text-[#94A3B8]" /> Search in Conversation
              </button>
              <button 
                onClick={() => { 
                  setIsMenuOpen(false); 
                  setIsMuted(!isMuted);
                  toast.success(isMuted ? 'Notifications unmuted' : 'Notifications muted'); 
                }}
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center gap-3 transition-colors"
              >
                {isMuted ? <Bell size={16} className="text-[#94A3B8]" /> : <BellOff size={16} className="text-[#94A3B8]" />} 
                {isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
              </button>
              <div className="h-px bg-[#E2E8F0] my-1.5" />
              <button 
                onClick={() => { 
                  setIsMenuOpen(false); 
                  if (otherParticipant) {
                    toggleBlockUser(otherParticipant.id);
                    toast.success(isBlocked ? 'User unblocked' : 'User blocked'); 
                  }
                }}
                className={`w-full px-4 py-2.5 text-left text-sm font-medium flex items-center gap-3 transition-colors ${
                  isBlocked ? 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]' : 'text-red-600 hover:bg-red-50'
                }`}
              >
                <Ban size={16} className={isBlocked ? "text-[#94A3B8]" : ""} /> 
                {isBlocked ? 'Unblock User' : 'Block User'}
              </button>
              <button 
                onClick={() => { 
                  setIsMenuOpen(false); 
                  deleteConversation(activeConversation.id);
                  toast.success('Chat deleted'); 
                }}
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
              >
                <Trash2 size={16} /> Delete Chat
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
