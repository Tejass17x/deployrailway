import React, { useState, useCallback, memo } from 'react';
import { Search, Pin, PinOff, Archive, ArchiveRestore, MessageCircle, Plus, X, BadgeCheck, Users2, Inbox } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import messagesService from '../services/messages.service';
import Avatar from '../../../components/ui/Avatar';
import { usePresence } from '../../../context/PresenceContext';

const ConversationItem = memo(({ conv, activeId, onSelect, onContextMenu, formatTime }) => {
  const { otherParticipant, lastMessage, unreadCount, isPinned, isGroup, name } = conv;
  const { getUserPresence } = usePresence();
  
  const fullName = isGroup ? name : (otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : 'Researcher');
  
  const presence = getUserPresence(otherParticipant?._id || otherParticipant?.id);
  const isOnline = presence.isOnline;
  const avatarUrl = isGroup ? '' : otherParticipant?.profileImage;
  const isActive = activeId === conv._id;
  const isUnread = unreadCount > 0;

  return (
    <div onClick={() => onSelect(conv._id)} onContextMenu={(e) => onContextMenu(e, conv)}
      className={`group flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all border ${isActive ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:border-slate-200 hover:shadow-sm'}`}>
      <div className="relative shrink-0">
        {isGroup ? (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-extrabold text-sm">
            {name ? name.substring(0, 2).toUpperCase() : 'GP'}
          </div>
        ) : (
          <div className={`rounded-2xl p-[2px] ${isUnread ? 'bg-gradient-to-br from-blue-500 to-indigo-500' : 'bg-transparent'}`}>
            <Avatar
              src={avatarUrl}
              name={fullName}
              size="w-11 h-11 text-sm"
              isOnline={isOnline}
            />
          </div>
        )}
        {isPinned && <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center"><Pin className="w-2.5 h-2.5 text-white fill-white" /></span>}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <span className={`text-[13.5px] truncate ${isUnread ? 'font-extrabold text-slate-900' : 'font-bold text-slate-700'}`}>{fullName}</span>
            {!isGroup && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500 shrink-0" />}
          </div>
          <span className={`text-[10.5px] shrink-0 ${isUnread ? 'text-blue-600 font-bold' : 'text-slate-400 font-medium'}`}>{formatTime(conv.lastMessageAt || lastMessage?.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={`text-[12px] truncate flex-1 ${isUnread ? 'text-slate-800 font-semibold' : 'text-slate-450 font-medium'}`}>
            {lastMessage?.deleted ? 'Deleted message' : lastMessage?.type === 'publication' ? '📄 Shared a publication' : lastMessage?.text || lastMessage?.message || 'No messages yet'}
          </p>
          {isUnread ? (
            <span className="shrink-0 min-w-[18px] h-[18px] px-1 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-extrabold">{unreadCount > 9 ? '9+' : unreadCount}</span>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); onContextMenu(e, conv); }} className="shrink-0 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 transition-opacity cursor-pointer text-[10px] font-bold hidden md:block">•••</button>
          )}
        </div>
      </div>
    </div>
  );
});
ConversationItem.displayName = 'ConversationItem';

const ConversationList = ({
  conversations = [],
  activeId,
  onSelect,
  activeSubTab = 'all',
  setActiveSubTab,
  contacts = null,
  onStartNewChat = null,
  onComposeClick = null
}) => {
  const { getUserPresence } = usePresence();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [sheetConv, setSheetConv] = useState(null);

  const pinMutation = useMutation({
    mutationFn: async ({ id, pin }) => {
      return pin ? await messagesService.pinConversation(id) : await messagesService.unpinConversation(id);
    },
    onSuccess: (_, variables) => {
      toast.success(variables.pin ? 'Conversation pinned' : 'Conversation unpinned');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Action failed')
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, archive }) => {
      return archive ? await messagesService.archiveConversation(id) : await messagesService.restoreConversation(id);
    },
    onSuccess: (_, variables) => {
      toast.success(variables.archive ? 'Conversation archived' : 'Conversation restored');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  const handlePinToggle = (conv) => { pinMutation.mutate({ id: conv._id, pin: !conv.isPinned }); setSheetConv(null); };
  const handleArchiveToggle = (conv) => { archiveMutation.mutate({ id: conv._id, archive: !conv.isArchived }); setSheetConv(null); };

  const handleContextMenu = useCallback((e, conv) => {
    e.preventDefault();
    setSheetConv(conv);
  }, []);

  const filtered = conversations.filter(conv => {
    const name = conv.isGroup ? conv.name.toLowerCase() : `${conv.otherParticipant?.firstName} ${conv.otherParticipant?.lastName}`.toLowerCase();
    if (!name.includes(search.toLowerCase())) return false;
    if (activeSubTab === 'unread') return conv.unreadCount > 0 && !conv.isArchived;
    if (activeSubTab === 'groups') return conv.isGroup && !conv.isArchived;
    if (activeSubTab === 'pinned') return conv.isPinned && !conv.isArchived;
    if (activeSubTab === 'archived') return conv.isArchived;
    return !conv.isArchived;
  });

  const totalUnread = conversations.reduce((sum, c) => sum + (c.isArchived ? 0 : (c.unreadCount || 0)), 0);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    const diffDays = Math.ceil(Math.abs(now - date) / 86400000);
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const peopleToShow = (() => {
    if (!contacts || !onStartNewChat) return [];
    const existingIds = new Set(conversations.map(c => c.otherParticipant?._id?.toString()).filter(Boolean));
    const seen = new Set();
    const all = [...(contacts.connections || []), ...(contacts.followers || []), ...(contacts.following || [])]
      .filter(p => { const id = p._id?.toString(); if (!id || seen.has(id) || existingIds.has(id)) return false; seen.add(id); return true; });
    const q = search.toLowerCase();
    return all.filter(p => !q || `${p.firstName} ${p.lastName}`.toLowerCase().includes(q));
  })();

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-slate-50 to-white text-left relative">
      <div className="shrink-0 px-4 pt-5 pb-3 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0">
              <Inbox className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">Inbox</h3>
              {totalUnread > 0 && <p className="text-[11px] font-bold text-blue-600 leading-tight">{totalUnread} unread</p>}
            </div>
          </div>
          <button onClick={onComposeClick} className="hidden md:flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm">
            <Plus className="w-3.5 h-3.5" strokeWidth={3} /> New chat
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={2.5} />
          <input type="text" placeholder="Search people or messages" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-100 rounded-2xl text-[13px] font-medium outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-3.5 h-3.5" /></button>}
        </div>

        <div className="flex gap-1.5 mt-3 overflow-x-auto no-scrollbar">
          {[{ id: 'all', label: 'All' }, { id: 'unread', label: 'Unread' }, { id: 'groups', label: 'Groups' }, { id: 'pinned', label: 'Pinned' }, { id: 'archived', label: 'Archived' }].map((tab) => (
            <button key={tab.id} onClick={() => setActiveSubTab(tab.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border ${activeSubTab === tab.id ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-1.5 pb-20 md:pb-2.5">
        {filtered.length > 0 ? filtered.map((conv) => (
          <ConversationItem
            key={conv._id}
            conv={conv}
            activeId={activeId}
            onSelect={onSelect}
            onContextMenu={handleContextMenu}
            formatTime={formatTime}
          />
        )) : (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <MessageCircle className="w-10 h-10 mx-auto opacity-25" />
            <p className="text-sm font-bold">No conversations here</p>
            <p className="text-xs text-slate-350">Start a new chat to get going</p>
          </div>
        )}

        {peopleToShow.length > 0 && (
          <div className="pt-3 mt-2 border-t border-slate-100">
            <div className="px-2 py-2 flex items-center gap-1.5"><Users2 className="w-3.5 h-3.5 text-slate-400" /><span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide">Start a chat</span></div>
            {peopleToShow.map(person => (
              <div key={person._id} onClick={() => onStartNewChat(person._id)} className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition-colors">
                <Avatar
                  src={person.profileImage}
                  name={`${person.firstName} ${person.lastName}`}
                  size="md"
                  isOnline={getUserPresence(person._id).isOnline}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-slate-800 truncate">{person.firstName} {person.lastName}</p>
                  <p className="text-[11px] text-slate-400 font-medium truncate">{person.designation || 'Researcher'}</p>
                </div>
                <span className="shrink-0 text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">Chat</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={onComposeClick} className="md:hidden absolute bottom-5 right-5 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center transition-all cursor-pointer z-20">
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      {sheetConv && (
        <div className="fixed inset-0 z-40 flex items-end md:items-center md:justify-center" onClick={() => setSheetConv(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div onClick={(e) => e.stopPropagation()} className="relative w-full md:w-72 bg-white rounded-t-3xl md:rounded-2xl p-2 pb-safe shadow-2xl">
            <div className="md:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto my-2.5" />
            <div className="px-3 py-2 text-[13px] font-extrabold text-slate-800 truncate">
              {sheetConv.isGroup ? sheetConv.name : `${sheetConv.otherParticipant?.firstName || ''} ${sheetConv.otherParticipant?.lastName || ''}`}
            </div>
            <button onClick={() => handlePinToggle(sheetConv)} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 cursor-pointer">
              {sheetConv.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />} {sheetConv.isPinned ? 'Unpin conversation' : 'Pin conversation'}
            </button>
            <button onClick={() => handleArchiveToggle(sheetConv)} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 cursor-pointer">
              {sheetConv.isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />} {sheetConv.isArchived ? 'Restore conversation' : 'Archive conversation'}
            </button>
            <button onClick={() => setSheetConv(null)} className="w-full text-center px-3 py-3 mt-1 text-sm font-bold text-slate-400 hover:text-slate-600 cursor-pointer">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationList;
