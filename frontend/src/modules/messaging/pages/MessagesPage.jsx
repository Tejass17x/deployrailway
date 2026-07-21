import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';
import { useCall } from '../../../context/CallContext';
import messagesService from '../services/messages.service';
import networkService from '../../connections/services/network.service';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import ResearcherInfo from '../components/ResearcherInfo';
import CallOverlay from '../components/CallOverlay';
import NewChatModal from '../components/NewChatModal';
import Avatar from '../../../components/ui/Avatar';
import { 
  MessageSquare, Mail, Star, Archive, Users, 
  Lightbulb, UserPlus, PhoneCall, FolderOpen, FileText, Ban, 
  Settings, Loader2, Shield, X, Check, Phone, Video, Search, Download, ExternalLink,
  SlidersHorizontal, ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const MessagesPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { user } = useAuth();
  const currentUserId = user?.userId || user?._id || user?.id;

  const userQueryId = searchParams.get('user');
  const conversationQueryId = searchParams.get('conversation');

  const [activeId, setActiveId] = useState(conversationId || null);
  const [localMessages, setLocalMessages] = useState([]);
  const [mobileView, setMobileView] = useState('list'); // 'list' or 'chat'
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [showFolderDrawer, setShowFolderDrawer] = useState(false);
  
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState('inbox'); // inbox, unread, starred, archived, groups, collaboration, requests, calls, files, settings
  const [activeSubTab, setActiveSubTab] = useState('all'); // all, unread, groups (used inside ConversationList)
  const [filesSearch, setFilesSearch] = useState('');

  const { startCall } = useCall();

  // Fetch active conversations list
  const { data: convData, isLoading: isConvLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await messagesService.getConversations();
      return res.data || [];
    }
  });

  const conversations = convData || [];

  const handleSelectConversation = (id) => {
    setActiveId(id);
    setMobileView('chat');
    navigate(`/messages/${id}`);
  };

  // Sync state with route parameters
  useEffect(() => {
    if (conversationId) {
      setActiveId(conversationId);
      setMobileView('chat');
    }
  }, [conversationId]);

  // Handle "?user=userId" query parameter to auto-open or create conversation
  useEffect(() => {
    if (!userQueryId || isConvLoading) return;

    // Check if we already have a conversation with this participant
    const existingConv = conversations.find(
      c => c.otherParticipant?._id === userQueryId || c.participants?.some(p => p?._id === userQueryId)
    );

    if (existingConv) {
      handleSelectConversation(existingConv._id);
    } else {
      const startNewChat = async () => {
        try {
          const res = await messagesService.createConversation(userQueryId);
          if (res.success && res.data) {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            queryClient.invalidateQueries({ queryKey: ['messagingContacts'] });
            handleSelectConversation(res.data._id);
          }
        } catch (err) {
          console.error('Failed to create new DM from query parameter:', err);
        }
      };
      startNewChat();
    }
  }, [userQueryId, isConvLoading, conversations]);

  // Handle "?conversation=conversationId" query parameter to auto-select conversation
  useEffect(() => {
    if (conversationQueryId) {
      handleSelectConversation(conversationQueryId);
    }
  }, [conversationQueryId]);

  const activeConversation = conversations.find(c => c._id === activeId);

  // Fetch connection requests (incoming) — now served by messaging module
  const { data: requestsData, refetch: refetchRequests } = useQuery({
    queryKey: ['networkRequests'],
    queryFn: async () => {
      const res = await messagesService.getRequests();
      return res.data || [];
    }
  });

  const incomingRequests = requestsData || [];

  // Fetch messaging contacts (connections + followers + following with online status)
  const { data: contactsData } = useQuery({
    queryKey: ['messagingContacts'],
    queryFn: async () => {
      const res = await messagesService.getContacts();
      return res.data || { connections: [], followers: [], following: [] };
    },
    staleTime: 60_000
  });

  const contactConnections = contactsData?.connections || [];
  const contactFollowers  = contactsData?.followers  || [];
  const contactFollowing  = contactsData?.following  || [];

  // Fetch Call History logs
  const { data: callHistoryData, isLoading: isCallsLoading } = useQuery({
    queryKey: ['callHistory'],
    queryFn: async () => {
      const res = await messagesService.getCallHistory();
      return res.data || [];
    },
    enabled: activeTab === 'calls'
  });

  // Fetch Shared Files list
  const { data: sharedFilesData, isLoading: isFilesLoading } = useQuery({
    queryKey: ['sharedFiles'],
    queryFn: async () => {
      const res = await messagesService.getSharedFiles();
      return res.data || [];
    },
    enabled: activeTab === 'files'
  });

  // Fetch messages history
  const { data: messagesData, isLoading: isMessagesLoading } = useQuery({
    queryKey: ['messages', activeId],
    queryFn: async () => {
      if (!activeId) return null;
      const res = await messagesService.getMessages(activeId, { limit: 50 });
      return res.data || { docs: [] };
    },
    enabled: !!activeId
  });

  const messagesList = messagesData?.docs || [];

  useEffect(() => {
    if (messagesData?.docs) {
      setLocalMessages(messagesData.docs);
    } else {
      setLocalMessages([]);
    }
  }, [messagesData, activeId]);

  // Mark conversation read mutation
  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      return await messagesService.markAsRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  // Connection Request Actions Mutations
  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      return await networkService.acceptRequest(requestId);
    },
    onSuccess: () => {
      toast.success('Connection accepted! DM initiated.');
      queryClient.invalidateQueries({ queryKey: ['networkRequests'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messagingContacts'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to accept request.');
    }
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      return await messagesService.rejectRequest(requestId);
    },
    onSuccess: () => {
      toast.success('Request declined.');
      queryClient.invalidateQueries({ queryKey: ['networkRequests'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to decline request.');
    }
  });

  // Socket room joining and cleanups — also rejoins on reconnect, since
  // socket.io reuses the same client instance across reconnects and this
  // effect's dependencies ([activeId, socket]) don't change when that happens.
  useEffect(() => {
    if (!socket || !activeId) return;

    const join = () => {
      socket.emit('chat:join', { conversationId: activeId });
      markReadMutation.mutate(activeId);
      queryClient.invalidateQueries({ queryKey: ['messages', activeId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    join();
    socket.on('connect', join);

    return () => {
      socket.off('connect', join);
      socket.emit('chat:leave', { conversationId: activeId });
    };
  }, [activeId, socket]);

  // Socket event listeners for messaging
  useEffect(() => {
    if (!socket) return;

    // Push an incoming message straight into the messages cache so it shows
    // up instantly, without waiting on a refetch round-trip.
    const handleNewMessage = (message) => {
      if (!message) return;
      const convId = message.conversationId?._id || message.conversationId;
      const senderIdStr = message.senderId?._id || message.senderId;
      console.log('🟢 [MessagesPage] message:new fired. convId=', convId, 'activeId=', activeId, 'hasCacheForConv=', !!queryClient.getQueryData(['messages', convId]));
      queryClient.setQueryData(['messages', convId], (old) => {
        if (!old) {
          console.log('🟢 [MessagesPage] no cache yet for this conversation, skipping patch');
          return old;
        }
        if (old.docs?.some((m) => m._id === message._id)) {
          console.log('🟢 [MessagesPage] message already in cache, skipping duplicate');
          return old;
        }
        // If this is our own message echoing back over the socket, drop its
        // optimistic placeholder so it isn't rendered twice.
        const docs = (old.docs || []).filter(
          (m) => !(m.tempId && senderIdStr === currentUserId && m.text === message.text)
        );
        console.log('🟢 [MessagesPage] patched cache, new doc count=', docs.length + 1);
        return { ...old, docs: [...docs, message] };
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    // Auto-update conversation list when new conversation is added
    const handleNewConversation = () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    // Listen for message delivered receipts
    const handleMessageDelivered = ({ messageId, conversationId: convId }) => {
      if (!convId || !messageId) return;
      queryClient.setQueryData(['messages', convId], (old) => {
        if (!old) return old;
        return {
          ...old,
          docs: old.docs.map((m) =>
            m._id === messageId && m.status !== 'seen' ? { ...m, status: 'delivered' } : m
          )
        };
      });
    };

    // Listen for read receipts
    const handleMessagesSeen = ({ conversationId: convId }) => {
      if (!convId) return;
      queryClient.setQueryData(['messages', convId], (old) => {
        if (!old) return old;
        return {
          ...old,
          docs: old.docs.map((m) => {
            const senderIdStr = m.senderId?._id || m.senderId;
            return senderIdStr === currentUserId && m.status !== 'seen'
              ? { ...m, status: 'seen' }
              : m;
          })
        };
      });
    };

    // Real-time message updates (edits, deletions, reactions)
    const handleMessageUpdate = (updatedMsg) => {
      if (activeId) {
        queryClient.invalidateQueries({ queryKey: ['messages', activeId] });
        if (updatedMsg && updatedMsg.conversationId === activeId) {
          setLocalMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
        }
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    const handleConversationUpdate = ({ conversationId: convId } = {}) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      if (activeId && (!convId || convId === activeId)) {
        queryClient.invalidateQueries({ queryKey: ['messages', activeId] });
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('receiveMessage', handleNewMessage);
    socket.on('message:received', handleNewMessage);
    socket.on('conversation:new', handleNewConversation);
    socket.on('message:delivered', handleMessageDelivered);
    socket.on('messageDelivered', handleMessageDelivered);
    socket.on('message:seen', handleMessagesSeen);
    socket.on('message:read', handleMessagesSeen);
    socket.on('messageRead', handleMessagesSeen);
    socket.on('message:update', handleMessageUpdate);
    socket.on('messageEdited', handleMessageUpdate);
    socket.on('messageDeleted', handleMessageUpdate);
    socket.on('reactionAdded', handleMessageUpdate);
    socket.on('reactionRemoved', handleMessageUpdate);
    socket.on('conversation:update', handleConversationUpdate);
    socket.on('conversationUpdated', handleConversationUpdate);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('receiveMessage', handleNewMessage);
      socket.off('message:received', handleNewMessage);
      socket.off('conversation:new', handleNewConversation);
      socket.off('message:delivered', handleMessageDelivered);
      socket.off('messageDelivered', handleMessageDelivered);
      socket.off('message:seen', handleMessagesSeen);
      socket.off('message:read', handleMessagesSeen);
      socket.off('messageRead', handleMessagesSeen);
      socket.off('message:update', handleMessageUpdate);
      socket.off('messageEdited', handleMessageUpdate);
      socket.off('messageDeleted', handleMessageUpdate);
      socket.off('reactionAdded', handleMessageUpdate);
      socket.off('reactionRemoved', handleMessageUpdate);
      socket.off('conversation:update', handleConversationUpdate);
      socket.off('conversationUpdated', handleConversationUpdate);
    };
  }, [socket, activeId, currentUserId]);

  // Send message mutation — optimistically renders the message immediately
  // (single grey tick) so it appears in real time even before the server
  // or the other participant has received it.
  const sendMessageMutation = useMutation({
    mutationFn: async (payload) => {
      return await messagesService.sendMessage({
        conversationId: activeId,
        ...payload
      });
    },
    onSuccess: (data) => {
      const savedMsg = data?.data || data;
      if (savedMsg) {
        setLocalMessages(prev => {
          const textToMatch = savedMsg.text || savedMsg.message;
          const index = prev.findLastIndex(m => m.isTemp && (m.text === textToMatch || m.message === textToMatch));
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = savedMsg;
            return updated;
          }
          return prev.map(m => m.isTemp ? savedMsg : m);
        });
      }
      queryClient.invalidateQueries({ queryKey: ['messages', activeId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: () => {
      toast.error('Failed to send message');
      setLocalMessages(prev => prev.filter(m => !m.isTemp));
    }
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, text }) => {
      return await messagesService.editMessage(messageId, text);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', activeId] });
    }
  });

  const handleSendMessage = (payload) => {
    if (payload.action === 'edit') {
      editMessageMutation.mutate({ messageId: payload.messageId, text: payload.text });
    } else {
      // Create optimistic message (Requirement 12)
      const tempId = `temp-${Date.now()}`;
      const tempMessage = {
        _id: tempId,
        conversationId: activeId,
        senderId: user?.userId || user?._id || user?.id || '',
        receiverId: activeConversation?.otherParticipant?._id || null,
        text: payload.text,
        message: payload.text,
        type: payload.type || 'text',
        messageType: payload.type || 'text',
        createdAt: new Date().toISOString(),
        status: 'sent', // Immediately append sender message on right. Status: sent.
        isTemp: true
      };
      setLocalMessages(prev => [...prev, tempMessage]);

      sendMessageMutation.mutate({
        text: payload.text,
        type: payload.type,
        attachmentId: payload.attachmentId,
        replyTo: payload.replyTo
      });
    }
  };

  // Start a new DM from the ConversationList People section
  const handleStartNewChatFromList = async (userId) => {
    try {
      const res = await messagesService.createConversation(userId);
      if (res.success && res.data) {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['messagingContacts'] });
        handleSelectConversation(res.data._id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start conversation.');
    }
  };



  // Filter conversations for the sidebar based on activeTab
  const getFilteredConversations = () => {
    if (activeTab === 'unread') return conversations.filter(c => c.unreadCount > 0);
    if (activeTab === 'starred') return conversations.filter(c => c.isPinned);
    if (activeTab === 'archived') return conversations.filter(c => c.isArchived);
    if (activeTab === 'groups') return conversations.filter(c => c.isGroup);
    if (activeTab === 'collaboration') return conversations.filter(c => c.isGroup); // Collaboration maps to group rooms
    return conversations.filter(c => !c.isArchived); // 'inbox' tab
  };

  const currentTabConversations = getFilteredConversations();

  // Calculations for unread counts
  const totalUnreadCount = conversations.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);

  // Open or create a DM conversation from a contact card
  const handleOpenContactDM = async (contact) => {
    if (contact.existingConversationId) {
      handleSelectConversation(contact.existingConversationId);
      setActiveTab('inbox');
      return;
    }
    try {
      const res = await messagesService.createConversation(contact._id);
      if (res.success && res.data) {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['messagingContacts'] });
        handleSelectConversation(res.data._id);
        setActiveTab('inbox');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not open conversation.');
    }
  };

  // Folder sidebar items list
  const sidebarFolders = [
    { id: 'inbox', label: 'Inbox', icon: MessageSquare, badge: totalUnreadCount > 0 ? totalUnreadCount : null },
    { id: 'unread', label: 'Unread', icon: Mail },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'archived', label: 'Archived', icon: Archive },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'collaboration', label: 'Research Collaboration', icon: Lightbulb },
    { id: 'requests', label: 'Connection Requests', icon: UserPlus, badge: incomingRequests.length > 0 ? incomingRequests.length : null },
    { id: 'calls', label: 'Calls', icon: PhoneCall },
    { id: 'files', label: 'Shared Files', icon: FolderOpen },
    { id: 'drafts', label: 'Drafts', icon: FileText },
    { id: 'blocked', label: 'Blocked Users', icon: Ban },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const activeFolder = sidebarFolders.find(f => f.id === activeTab);
  const ActiveFolderIcon = activeFolder?.icon;

  const selectFolder = (folderId) => {
    setActiveTab(folderId);
    if (folderId === 'unread') setActiveSubTab('unread');
    else if (folderId === 'groups') setActiveSubTab('groups');
    else setActiveSubTab('all');
    setShowFolderDrawer(false);
  };

  // Shared folder-list markup, reused by both the mobile bottom sheet and the
  // desktop dropdown so the two stay visually/behaviorally in sync.
  const renderFolderNav = (navClassName) => (
    <nav className={navClassName}>
      {sidebarFolders.map((folder) => {
        const IconComponent = folder.icon;
        const isActive = activeTab === folder.id;
        return (
          <button
            key={folder.id}
            onClick={() => selectFolder(folder.id)}
            className={`w-full flex items-center justify-between px-3.5 py-3 md:py-2.5 rounded-2xl md:rounded-xl text-sm md:text-xs font-bold transition-all cursor-pointer ${
              isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <IconComponent className={`w-4.5 h-4.5 md:w-4 md:h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{folder.label}</span>
            </div>
            {folder.badge && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {folder.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-6 md:-m-8 bg-slate-50/50 overflow-hidden relative select-none">

      {/* Filter trigger button — hidden on mobile once a chat is open, always visible on desktop/tablet. */}
      <div
        className={`items-center gap-2 px-4 py-2.5 bg-white border-b border-slate-100 shrink-0 relative z-20 ${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="relative">
          <button
            onClick={() => setShowFolderDrawer((prev) => !prev)}
            aria-expanded={showFolderDrawer}
            className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border active:scale-95 ${
              showFolderDrawer
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-slate-100 border-transparent hover:bg-slate-200 text-slate-700'
            }`}
            title="Filter by workspace folder"
          >
            <SlidersHorizontal className={`w-3.5 h-3.5 ${showFolderDrawer ? 'text-white' : 'text-blue-600'}`} />
            <span>Filter</span>
            <span className={`w-px h-3.5 ${showFolderDrawer ? 'bg-white/30' : 'bg-slate-300'}`} />
            {ActiveFolderIcon && <ActiveFolderIcon className={`w-3.5 h-3.5 ${showFolderDrawer ? 'text-white' : 'text-blue-600'}`} />}
            <span>{activeFolder?.label || 'Inbox'}</span>
            {activeFolder?.badge ? (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${showFolderDrawer ? 'bg-white/25 text-white' : 'bg-blue-600 text-white'}`}>{activeFolder.badge}</span>
            ) : null}
            <ChevronDown className={`w-3 h-3 transition-transform ${showFolderDrawer ? 'rotate-180 text-white' : 'text-slate-400'}`} />
          </button>

          {/* Desktop/tablet: compact dropdown anchored right under the button — no full-screen takeover. */}
          {showFolderDrawer && (
            <>
              <div className="hidden md:block fixed inset-0 z-40" onClick={() => setShowFolderDrawer(false)} />
              <div className="hidden md:flex absolute left-0 top-full mt-2 w-72 z-50 flex-col bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-[70vh] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
                  <h2 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                    <span>Workspace Folders</span>
                  </h2>
                  <button
                    onClick={() => setShowFolderDrawer(false)}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
                {renderFolderNav('flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-1')}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile: bottom sheet — easier to reach with a thumb than a side drawer. */}
      {showFolderDrawer && (
        <div
          className="md:hidden fixed inset-0 z-50 flex items-end"
          onClick={() => setShowFolderDrawer(false)}
        >
          <div className="absolute inset-0 bg-black/30 animate-in fade-in duration-150" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-h-[75vh] bg-white rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-200"
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto my-2.5 shrink-0" />
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 shrink-0">
              <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Workspace Folders</span>
              </h2>
              <button
                onClick={() => setShowFolderDrawer(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            {renderFolderNav('flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-1')}
          </div>
        </div>
      )}

      {/* 2. Middle Content Section (Changes based on selected Folder tab) */}
      <div className="flex-1 min-h-0 flex overflow-hidden bg-white">
        {activeTab === 'followers' ? (
          /* Followers Panel */
          <div className="flex-1 h-full overflow-y-auto p-6 bg-slate-50/20 text-left">
            <div className="mb-6">
              <h3 className="text-base font-extrabold text-slate-800">Followers</h3>
              <p className="text-xs text-slate-450 font-semibold mt-0.5">Researchers who follow your work. You can message them directly.</p>
            </div>
            {contactFollowers.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {contactFollowers.map((person) => (
                  <div key={person._id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={person.profileImage}
                        name={`${person.firstName} ${person.lastName}`}
                        size="lg"
                        isOnline={person.isOnline}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-slate-800 truncate">{person.firstName} {person.lastName}</h4>
                        <p className="text-xs text-slate-500 font-bold truncate">{person.designation || 'Researcher'}</p>
                        <p className="text-xs text-slate-400 font-semibold truncate">{person.institution}</p>
                      </div>
                      <button
                        onClick={() => handleOpenContactDM(person)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-blue-500/10 shrink-0"
                      >
                        {person.existingConversationId ? 'Open Chat' : 'Message'}
                      </button>
                    </div>
                    {person.bio && <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 italic bg-slate-50 p-2.5 rounded-xl">"{person.bio}"</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400 space-y-3">
                <Users className="w-12 h-12 mx-auto opacity-30 animate-pulse" />
                <p className="text-sm font-black">No followers yet.</p>
              </div>
            )}
          </div>
        ) : activeTab === 'following' ? (
          /* Following Panel */
          <div className="flex-1 h-full overflow-y-auto p-6 bg-slate-50/20 text-left">
            <div className="mb-6">
              <h3 className="text-base font-extrabold text-slate-800">Following</h3>
              <p className="text-xs text-slate-450 font-semibold mt-0.5">Researchers you follow. Start a conversation directly.</p>
            </div>
            {contactFollowing.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {contactFollowing.map((person) => (
                  <div key={person._id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={person.profileImage}
                        name={`${person.firstName} ${person.lastName}`}
                        size="lg"
                        isOnline={person.isOnline}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-slate-800 truncate">{person.firstName} {person.lastName}</h4>
                        <p className="text-xs text-slate-500 font-bold truncate">{person.designation || 'Researcher'}</p>
                        <p className="text-xs text-slate-400 font-semibold truncate">{person.institution}</p>
                      </div>
                      <button
                        onClick={() => handleOpenContactDM(person)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-blue-500/10 shrink-0"
                      >
                        {person.existingConversationId ? 'Open Chat' : 'Message'}
                      </button>
                    </div>
                    {person.bio && <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 italic bg-slate-50 p-2.5 rounded-xl">"{person.bio}"</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400 space-y-3">
                <Users className="w-12 h-12 mx-auto opacity-30 animate-pulse" />
                <p className="text-sm font-black">You are not following anyone yet.</p>
              </div>
            )}
          </div>
        ) : activeTab === 'requests' ? (
          /* Connection Requests List Page View */
          <div className="flex-1 h-full overflow-y-auto p-6 bg-slate-50/20 text-left">
            <div className="mb-6">
              <h3 className="text-base font-extrabold text-slate-800">Connection Requests</h3>
              <p className="text-xs text-slate-450 font-semibold mt-0.5">Manage incoming collaborations from fellow researchers.</p>
            </div>
            
            {incomingRequests.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {incomingRequests.map((req) => {
                  const { user, profile, hasGoogleScholar, _id } = req;
                  const reqName = `${user.firstName} ${user.lastName}`;
                  return (
                    <div key={_id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <Avatar
                          src={user.profileImage}
                          name={reqName}
                          size="w-14 h-14 text-lg"
                        />
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-black text-slate-800 truncate leading-snug">{reqName}</h4>
                            <Shield className="w-4 h-4 text-blue-600 fill-blue-600" />
                            {hasGoogleScholar && (
                              <span className="px-1.5 py-0.5 bg-sky-50 text-[9px] text-sky-600 font-extrabold rounded-md uppercase border border-sky-100">
                                Google Scholar
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-bold truncate mt-0.5">{profile?.designation || 'Researcher'}</p>
                          <p className="text-xs text-slate-400 font-semibold truncate">{profile?.institution || 'Academic Institution'}</p>
                        </div>
                        {profile?.metrics?.researchScore > 0 && (
                          <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-3 py-1 rounded-2xl text-center">
                            <p className="text-[9px] font-black uppercase text-emerald-500">Score</p>
                            <p className="text-xs font-black">{profile.metrics.researchScore}</p>
                          </div>
                        )}
                      </div>

                      {/* Bio excerpt */}
                      {profile?.bio && (
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 italic bg-slate-50 p-2.5 rounded-xl">
                          "{profile.bio}"
                        </p>
                      )}

                      {/* Research Areas */}
                      {profile?.skills && profile.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {profile.skills.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded-lg font-bold">
                              {typeof skill === 'string' ? skill : skill.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-3">
                        <div className="text-[10px] text-slate-400 font-bold">
                          Received {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => rejectRequestMutation.mutate(_id)}
                            className="px-4 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Decline
                          </button>
                          <button 
                            onClick={() => acceptRequestMutation.mutate(_id)}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-blue-500/10"
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400 space-y-3">
                <UserPlus className="w-12 h-12 mx-auto opacity-30 animate-pulse" />
                <p className="text-sm font-black">All caught up! No connection requests.</p>
              </div>
            )}
          </div>
        ) : activeTab === 'calls' ? (
          /* Calls History Logs View */
          <div className="flex-1 h-full overflow-y-auto p-6 bg-slate-50/20 text-left">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Call History</h3>
                <p className="text-xs text-slate-450 font-semibold mt-0.5">Logs of all voice and video signaling meetings.</p>
              </div>
            </div>

            {isCallsLoading ? (
              <div className="py-16 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : callHistoryData && callHistoryData.length > 0 ? (
              <>
                {/* Mobile card list */}
                <div className="sm:hidden space-y-2.5">
                  {callHistoryData.map((call) => {
                    const other = call.participants.find(p => p._id !== socket?.userId);
                    const contactName = other ? `${other.firstName} ${other.lastName}` : 'Researcher';
                    const isVideo = call.type === 'video';
                    return (
                      <div key={call._id} className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm flex items-center gap-3">
                        <Avatar
                          src={other?.profileImage}
                          name={contactName}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[13px] font-black text-slate-800 truncate">{contactName}</p>
                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              call.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                : call.status === 'missed'
                                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                  : 'bg-slate-50 text-slate-655 border border-slate-150'
                            }`}>
                              {call.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-450 font-semibold mt-0.5">
                            {isVideo ? '📹 Video' : '📞 Voice'} • {call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : '--'}
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{new Date(call.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tablet / desktop table */}
                <div className="hidden sm:block bg-white border border-slate-200 rounded-3xl overflow-x-auto shadow-sm">
                <table className="w-full text-left border-collapse min-w-[560px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black uppercase text-slate-450 tracking-wider">
                      <th className="p-4">Contact</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Duration</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                    {callHistoryData.map((call) => {
                      const other = call.participants.find(p => p._id !== socket?.userId);
                      const contactName = other ? `${other.firstName} ${other.lastName}` : 'Researcher';
                      const isVideo = call.type === 'video';
                      
                      return (
                        <tr key={call._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 flex items-center gap-3">
                            <Avatar
                              src={other?.profileImage}
                              name={contactName}
                              size="sm"
                            />
                            <span>{contactName}</span>
                          </td>
                          <td className="p-4 capitalize">
                            {isVideo ? '📹 Video Call' : '📞 Voice Call'}
                          </td>
                          <td className="p-4 text-slate-400 font-semibold">
                            {new Date(call.createdAt).toLocaleString()}
                          </td>
                          <td className="p-4 tabular-nums">
                            {call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : '--'}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              call.status === 'completed' 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                : call.status === 'missed' 
                                  ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                                  : 'bg-slate-50 text-slate-655 border border-slate-150'
                            }`}>
                              {call.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </>
            ) : (
              <div className="py-24 text-center text-slate-400 space-y-3">
                <PhoneCall className="w-12 h-12 mx-auto opacity-30" />
                <p className="text-sm font-black">No call logs found</p>
              </div>
            )}
          </div>
        ) : activeTab === 'files' ? (
          /* Shared Files Gallery View */
          <div className="flex-1 h-full overflow-y-auto p-6 bg-slate-50/20 text-left">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Shared Files</h3>
                <p className="text-xs text-slate-450 font-semibold mt-0.5">Access all PDFs, research papers, and datasets exchanged.</p>
              </div>
              <div className="relative w-64 shrink-0">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search shared files..."
                  value={filesSearch}
                  onChange={(e) => setFilesSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all text-slate-700 shadow-xs"
                />
              </div>
            </div>

            {isFilesLoading ? (
              <div className="py-16 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : sharedFilesData && sharedFilesData.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sharedFilesData
                  .filter(m => m.attachment?.filename?.toLowerCase().includes(filesSearch.toLowerCase()))
                  .map((msg) => {
                    const { attachment, senderId } = msg;
                    if (!attachment) return null;
                    return (
                      <div key={msg._id} className="bg-white border border-slate-200 rounded-3xl p-4.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-650 shrink-0 font-extrabold text-sm">
                            📄
                          </div>
                          <div className="min-w-0 text-left">
                            <h5 className="text-xs font-black text-slate-800 truncate leading-snug" title={attachment.filename}>
                              {attachment.filename}
                            </h5>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                              {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB • {attachment.fileType?.split('/')[1]?.toUpperCase() || 'FILE'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-4">
                          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold">
                            <Avatar
                              src={senderId?.profileImage}
                              name={`${senderId?.firstName || ''} ${senderId?.lastName || ''}`.trim() || 'Sender'}
                              size="w-5 h-5 text-[8px]"
                            />
                            <span className="truncate max-w-[80px]">By {senderId?.firstName}</span>
                          </div>
                          <a 
                            href={attachment.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 hover:scale-105 active:scale-95 text-blue-600 rounded-lg transition-all cursor-pointer flex items-center justify-center shadow-xs"
                            title="Download/Open File"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400 space-y-3">
                <FolderOpen className="w-12 h-12 mx-auto opacity-30" />
                <p className="text-sm font-black">No shared files found</p>
              </div>
            )}
          </div>
        ) : activeTab === 'settings' ? (
          /* Chat Settings View */
          <div className="flex-1 h-full overflow-y-auto p-6 bg-slate-50/20 text-left">
            <div className="mb-6">
              <h3 className="text-base font-extrabold text-slate-800">Chat Settings</h3>
              <p className="text-xs text-slate-450 font-semibold mt-0.5">Manage preferences, blocklists, and security keys.</p>
            </div>

            <div className="max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Notifications</h4>
                <div className="flex items-center justify-between">
                  <div className="text-xs">
                    <p className="font-bold text-slate-850">Desktop Notifications</p>
                    <p className="text-slate-400 font-semibold mt-0.5">Show banner alerts for incoming messages and call rings.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-600" />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Privacy & Security</h4>
                <div className="flex items-center justify-between">
                  <div className="text-xs">
                    <p className="font-bold text-slate-850">End-to-End Encryption Keys</p>
                    <p className="text-slate-400 font-semibold mt-0.5">Regenerate and sync cryptographic keys for secure media sharing.</p>
                  </div>
                  <button className="px-3.5 py-1.5 border border-blue-600 text-blue-600 hover:bg-blue-50/30 rounded-xl text-xs font-bold transition-all cursor-pointer">
                    Regenerate Keys
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h4 className="text-xs font-black uppercase text-red-500 tracking-wider">Danger Zone</h4>
                <div className="flex items-center justify-between">
                  <div className="text-xs">
                    <p className="font-bold text-slate-850">Clear Conversations History</p>
                    <p className="text-slate-400 font-semibold mt-0.5">Permanently delete all text messages logs from client memory.</p>
                  </div>
                  <button className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer">
                    Clear History
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Normal Messaging Workflow (Inbox, Starred, Groups, etc.) */
          <>
            {/* Conversation list */}
            <div 
              className={`h-full transition-all duration-300 shrink-0 w-full md:w-80 ${
                mobileView === 'chat' ? 'hidden md:block' : 'block'
              }`}
            >
              <ConversationList
                conversations={currentTabConversations}
                activeId={activeId}
                onSelect={handleSelectConversation}
                activeSubTab={activeSubTab}
                setActiveSubTab={setActiveSubTab}
                contacts={contactsData}
                onStartNewChat={handleStartNewChatFromList}
                onComposeClick={() => setIsComposeOpen(true)}
              />
            </div>

            {/* Main chat window center view — on mobile this (including the "Welcome" empty state) only shows once the user taps into a chat; on desktop it's always visible. */}
            <div 
              className={`flex-1 h-full flex flex-col min-w-0 bg-white relative ${
                mobileView === 'chat' ? 'flex' : 'hidden md:flex'
              }`}
            >
              <ChatWindow
                conversation={activeConversation}
                messages={localMessages}
                isLoading={isMessagesLoading}
                onSendMessage={handleSendMessage}
                onStartCall={(type) => startCall(activeConversation?.otherParticipant?._id, type, activeConversation?._id)}
                socket={socket}
                showInfoPanel={showInfoPanel}
                setShowInfoPanel={setShowInfoPanel}
                onBack={() => setMobileView('list')}
              />
            </div>

            {/* Right details sidebar (desktop) / bottom sheet overlay (mobile & tablet) */}
            {activeConversation && showInfoPanel && (
              <>
                <div className="hidden lg:block h-full shrink-0 animate-in slide-in-from-right duration-200">
                  <ResearcherInfo
                    participant={activeConversation.otherParticipant}
                    conversation={activeConversation}
                    messages={localMessages}
                    onClose={() => setShowInfoPanel(false)}
                  />
                </div>

                <div
                  className="lg:hidden fixed inset-0 z-40 flex items-end sm:items-center sm:justify-center"
                  onClick={() => setShowInfoPanel(false)}
                >
                  <div className="absolute inset-0 bg-black/30" />
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full sm:w-96 max-h-[85vh] min-h-0 bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                  >
                    <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto my-2.5 shrink-0" />
                    <ResearcherInfo
                      participant={activeConversation.otherParticipant}
                      conversation={activeConversation}
                      messages={localMessages}
                      onClose={() => setShowInfoPanel(false)}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Call Overlay Panel */}
      <CallOverlay />

      {/* Compose / New Chat Modal */}
      <NewChatModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        contacts={contactsData}
        onSelectContact={handleStartNewChatFromList}
      />
    </div>
  );
};

export default MessagesPage;