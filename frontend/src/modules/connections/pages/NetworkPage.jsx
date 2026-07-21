import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Users, UserPlus, Mail, UserCheck, ChevronRight, 
  Sparkles, MessageSquare, ShieldAlert, Award, 
  MapPin, Check, X, Ban, MoreVertical, Search, Heart, 
  Circle, GraduationCap, Compass, HelpCircle, Activity 
} from 'lucide-react';
import networkService from '../services/network.service';
import { useSocket } from '../../../context/SocketContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import UserAvatar from '../../../components/ui/Avatar';

const NetworkPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const currentUser = useSelector((state) => state.auth.user);
  
  // Tabs for the Right Column "Your Network"
  const [networkTab, setNetworkTab] = useState('connections'); // connections | followers | following
  const [networkSearch, setNetworkSearch] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);

  // 1. Fetch Network Stats Overview
  const { data: overview, refetch: refetchOverview } = useQuery({
    queryKey: ['networkOverview'],
    queryFn: async () => {
      const res = await networkService.getOverview();
      return res.data;
    }
  });

  // 2. Fetch People You May Know Suggestions
  const { data: suggestionsData, isLoading: loadingSuggestions } = useQuery({
    queryKey: ['networkSuggestions'],
    queryFn: async () => {
      const res = await networkService.getSuggestions({ limit: 5, page: 1 });
      return res.data?.docs || [];
    }
  });

  // 3. Fetch Received & Sent Connection Requests
  const { data: requestsData, refetch: refetchRequests } = useQuery({
    queryKey: ['networkRequests'],
    queryFn: async () => {
      const res = await networkService.getRequests();
      return res.data || { received: [], sent: [] };
    }
  });

  // 4. Fetch Active Tab List (Connections / Followers / Following)
  const { data: activeList, isLoading: loadingActiveList } = useQuery({
    queryKey: ['networkTabList', networkTab, networkSearch],
    queryFn: async () => {
      let res;
      if (networkTab === 'connections') {
        res = await networkService.getConnections({ search: networkSearch });
      } else if (networkTab === 'followers') {
        res = await networkService.getFollowers({ search: networkSearch });
      } else {
        res = await networkService.getFollowing({ search: networkSearch });
      }
      return res.data?.docs || [];
    }
  });

  // 5. Setup socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['networkOverview'] });
      queryClient.invalidateQueries({ queryKey: ['networkRequests'] });
      queryClient.invalidateQueries({ queryKey: ['networkTabList'] });
      queryClient.invalidateQueries({ queryKey: ['networkSuggestions'] });
    };

    socket.on('connection_request_received', handleUpdate);
    socket.on('connection_accepted', handleUpdate);
    socket.on('connection_rejected', handleUpdate);
    socket.on('connection_removed', handleUpdate);
    socket.on('follow_updated', handleUpdate);

    return () => {
      socket.off('connection_request_received', handleUpdate);
      socket.off('connection_accepted', handleUpdate);
      socket.off('connection_rejected', handleUpdate);
      socket.off('connection_removed', handleUpdate);
      socket.off('follow_updated', handleUpdate);
    };
  }, [socket, queryClient]);

  // Mutations
  const connectMutation = useMutation({
    mutationFn: ({ userId }) => networkService.connect(userId),
    onSuccess: (_data, variables) => {
      toast.success('Connection request updated!');

      // Update the cache immediately so the button flips to "Pending" right
      // away, in sync with the toast, instead of waiting for the network
      // round-trip triggered by invalidateQueries below.
      queryClient.setQueryData(['networkSuggestions'], (old) => {
        if (!old) return old;
        return old.map((item) =>
          item.user._id === variables.userId
            ? { ...item, connectionStatus: 'pending_sent' }
            : item
        );
      });

      queryClient.invalidateQueries({ queryKey: ['networkOverview'] });
      queryClient.invalidateQueries({ queryKey: ['networkRequests'] });
      queryClient.invalidateQueries({ queryKey: ['networkSuggestions'] });
    }
  });

  const followMutation = useMutation({
    mutationFn: ({ userId }) => networkService.follow(userId),
    onMutate: async ({ userId }) => {
      // Optimistically flip Follow Back -> Following right away so the tab
      // list stays in sync with the click instead of waiting on a refetch.
      await queryClient.cancelQueries({ queryKey: ['networkTabList'] });
      const previous = queryClient.getQueryData(['networkTabList', networkTab, networkSearch]);
      queryClient.setQueryData(['networkTabList', networkTab, networkSearch], (old) => {
        if (!old) return old;
        return old.map((item) => (item.id === userId ? { ...item, isFollowing: true } : item));
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['networkTabList', networkTab, networkSearch], context.previous);
      }
    },
    onSuccess: () => {
      toast.success('Researcher followed!');
      queryClient.invalidateQueries({ queryKey: ['networkOverview'] });
      queryClient.invalidateQueries({ queryKey: ['networkTabList'] });
    }
  });

  const unfollowMutation = useMutation({
    mutationFn: ({ userId }) => networkService.unfollow(userId),
    onMutate: async ({ userId }) => {
      await queryClient.cancelQueries({ queryKey: ['networkTabList'] });
      const previous = queryClient.getQueryData(['networkTabList', networkTab, networkSearch]);
      queryClient.setQueryData(['networkTabList', networkTab, networkSearch], (old) => {
        if (!old) return old;
        return old.map((item) => (item.id === userId ? { ...item, isFollowing: false } : item));
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['networkTabList', networkTab, networkSearch], context.previous);
      }
    },
    onSuccess: () => {
      toast.success('Researcher unfollowed!');
      queryClient.invalidateQueries({ queryKey: ['networkOverview'] });
      queryClient.invalidateQueries({ queryKey: ['networkTabList'] });
    }
  });

  const acceptMutation = useMutation({
    mutationFn: ({ requestId }) => networkService.acceptRequest(requestId),
    onSuccess: () => {
      toast.success('Connection request accepted!');
      queryClient.invalidateQueries({ queryKey: ['networkOverview'] });
      queryClient.invalidateQueries({ queryKey: ['networkRequests'] });
      queryClient.invalidateQueries({ queryKey: ['networkTabList'] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ requestId }) => networkService.rejectRequest(requestId),
    onSuccess: () => {
      toast.success('Connection request declined.');
      queryClient.invalidateQueries({ queryKey: ['networkOverview'] });
      queryClient.invalidateQueries({ queryKey: ['networkRequests'] });
    }
  });

  const removeConnectionMutation = useMutation({
    mutationFn: ({ connectionId }) => networkService.removeConnection(connectionId),
    onSuccess: () => {
      toast.success('Connection removed.');
      queryClient.invalidateQueries({ queryKey: ['networkOverview'] });
      queryClient.invalidateQueries({ queryKey: ['networkTabList'] });
    }
  });

  return (
    <div className="space-y-6 md:space-y-8 text-left bg-slate-50/50 min-h-screen px-3 sm:px-4 md:px-0 pb-12">
      
      {/* 1. Header Hero section */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 rounded-2xl md:rounded-3xl p-5 sm:p-6 md:p-8 text-white relative overflow-hidden shadow-xl border border-indigo-200/10">
        <div className="hidden sm:flex absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none items-center justify-center">
          <Users className="w-64 h-64 text-white" />
        </div>
        <div className="max-w-2xl space-y-2.5 md:space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 md:px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] sm:text-xs font-bold tracking-wide border border-white/10 uppercase">
            <Sparkles className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
            <span>Grow Your Academic Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">My Network Dashboard</h1>
          <p className="text-xs sm:text-sm text-indigo-100 font-semibold leading-relaxed">
            Connect, follow, and collaborate with leading researchers, mutual co-authors, and departments matching your interest areas.
          </p>
        </div>
      </div>

      {/* 2. Top Statistics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        
        {/* Connections Card */}
        <div className="bg-white rounded-xl md:rounded-2xl border border-slate-200 p-3.5 sm:p-5 shadow-sm transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Connections</span>
            <div className="p-1.5 sm:p-2 bg-blue-50 text-blue-600 rounded-lg sm:rounded-xl shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-xl sm:text-2xl font-black text-slate-900">{overview?.connections || 0}</p>
            <p className="text-[8px] sm:text-[9px] text-emerald-600 font-bold uppercase tracking-wider mt-1">+12 this month</p>
          </div>
        </div>

        {/* Followers Card */}
        <div className="bg-white rounded-xl md:rounded-2xl border border-slate-200 p-3.5 sm:p-5 shadow-sm transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Followers</span>
            <div className="p-1.5 sm:p-2 bg-indigo-50 text-indigo-600 rounded-lg sm:rounded-xl shrink-0">
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-xl sm:text-2xl font-black text-slate-900">{overview?.followers || 0}</p>
            <p className="text-[8px] sm:text-[9px] text-indigo-500 font-bold uppercase tracking-wider mt-1">+28 this month</p>
          </div>
        </div>

        {/* Following Card */}
        <div className="bg-white rounded-xl md:rounded-2xl border border-slate-200 p-3.5 sm:p-5 shadow-sm transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Following</span>
            <div className="p-1.5 sm:p-2 bg-purple-50 text-purple-600 rounded-lg sm:rounded-xl shrink-0">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-xl sm:text-2xl font-black text-slate-900">{overview?.following || 0}</p>
            <p className="text-[8px] sm:text-[9px] text-purple-500 font-bold uppercase tracking-wider mt-1">+18 this month</p>
          </div>
        </div>

        {/* Pending Requests Card */}
        <div className="bg-white rounded-xl md:rounded-2xl border border-slate-200 p-3.5 sm:p-5 shadow-sm transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Req.</span>
            <div className="p-1.5 sm:p-2 bg-amber-50 text-amber-600 rounded-lg sm:rounded-xl shrink-0">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-xl sm:text-2xl font-black text-slate-900">{overview?.pendingRequests || 0}</p>
            <p className="text-[8px] sm:text-[9px] text-amber-650 font-bold uppercase tracking-wider mt-1">Needs attention</p>
          </div>
        </div>

        {/* Collaboration Requests Card */}
        <div className="bg-white rounded-xl md:rounded-2xl border border-slate-200 p-3.5 sm:p-5 shadow-sm transition-all duration-200 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Collab Invitations</span>
            <div className="p-1.5 sm:p-2 bg-emerald-50 text-emerald-600 rounded-lg sm:rounded-xl shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-xl sm:text-2xl font-black text-slate-900">{overview?.collaborationRequests || 0}</p>
            <p className="text-[8px] sm:text-[9px] text-emerald-600 font-bold uppercase tracking-wider mt-1">Open workspaces</p>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Grid (3-Column Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        
        {/* Column 1: People You May Know Suggestions (Col Span: 4) */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-5 w-full min-w-0">
          <div className="flex justify-between items-center px-1 gap-2">
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase truncate">People You May Know</h3>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-wider mt-0.5">AI Recommendations</p>
            </div>
            <Link to="/discover/researchers" state={{ fromNetwork: true }} className="text-xs font-bold text-blue-600 hover:underline flex items-center shrink-0">
              View All
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {loadingSuggestions ? (
              [...Array(3)].map((_, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 h-36 animate-pulse" />
              ))
            ) : suggestionsData && suggestionsData.length > 0 ? (
              suggestionsData.map((cand) => (
                <div 
                  key={cand.user._id}
                  className="bg-white rounded-xl md:rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all duration-200 space-y-3 sm:space-y-4 flex flex-col justify-between"
                >
                  <div className="flex gap-3 sm:gap-4 items-start">
                    <UserAvatar user={cand.user} size="lg" showBorder />
                    <div className="min-w-0 flex-1">
                      <h4 
                        onClick={() => navigate(`/profile/${cand.user.profileSlug || cand.user.username}`)}
                        className="text-xs sm:text-sm font-black text-slate-900 hover:text-blue-600 transition-colors cursor-pointer truncate"
                      >
                        {cand.user.fullName}
                      </h4>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold line-clamp-1 leading-snug">{cand.profile?.headline || 'Academic Researcher'}</p>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 font-black flex items-center gap-1 mt-1">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">{cand.profile?.institution || 'Research Institute'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">{cand.matchPercentage}% Match</span>
                    {cand.connectionStatus === 'pending_sent' ? (
                      <span className="px-3 sm:px-4 py-1.5 bg-amber-50 text-amber-600 text-[9px] sm:text-[10px] font-black uppercase rounded-lg border border-amber-200 flex items-center gap-1 cursor-default shrink-0">
                        <Mail className="w-3 h-3" />
                        Pending
                      </span>
                    ) : cand.connectionStatus === 'connected' ? (
                      <span className="px-3 sm:px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[9px] sm:text-[10px] font-black uppercase rounded-lg border border-emerald-200 flex items-center gap-1 cursor-default shrink-0">
                        <UserCheck className="w-3 h-3" />
                        Connected
                      </span>
                    ) : (
                      <button
                        onClick={() => connectMutation.mutate({ userId: cand.user._id })}
                        className="px-3 sm:px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[9px] sm:text-[10px] font-black uppercase rounded-lg shadow-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer shrink-0"
                      >
                        <UserPlus className="w-3 h-3" />
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 italic text-xs font-semibold">
                No matching recommendations.
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Connection Requests Queue (Col Span: 4) */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-5 w-full min-w-0">
          <div className="flex justify-between items-center px-1 gap-2">
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase truncate">Invitations</h3>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-wider mt-0.5">Pending received requests</p>
            </div>
            <Link to="/network/invitations" className="text-xs font-bold text-blue-650 hover:underline flex items-center shrink-0">
              Manage
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {requestsData?.received && requestsData.received.length > 0 ? (
              requestsData.received.map((req) => (
                <div 
                  key={req._id}
                  className="bg-white rounded-xl md:rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all duration-200 space-y-3 sm:space-y-4"
                >
                  <div className="flex gap-3 sm:gap-4 items-start">
                    <UserAvatar user={req.user} size="lg" showBorder />
                    <div className="min-w-0 flex-1">
                      <h4 
                        onClick={() => navigate(`/profile/${req.user.profileSlug || req.user.username}`)}
                        className="text-xs sm:text-sm font-black text-slate-900 hover:text-blue-600 transition-colors cursor-pointer truncate"
                      >
                        {req.user.fullName}
                      </h4>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold line-clamp-1 leading-snug">{req.profile?.headline || 'Researcher'}</p>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 font-black flex items-center gap-1 mt-1">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">{req.profile?.institution || 'Institution'}</span>
                      </p>
                    </div>
                  </div>

                  {req.note && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] sm:text-[11px] font-semibold text-slate-600 leading-snug break-words">
                      "{req.note}"
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => acceptMutation.mutate({ requestId: req._id })}
                      className="flex-1 py-2 sm:py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase rounded-lg shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Accept
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate({ requestId: req._id })}
                      className="flex-1 py-2 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 text-[10px] font-black uppercase rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    >
                      <X className="w-3.5 h-3.5 text-slate-450" />
                      Decline
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl md:rounded-2xl p-6 sm:p-8 text-center text-slate-405 font-bold uppercase tracking-wider text-xs flex flex-col items-center justify-center gap-3">
                <Mail className="w-8 h-8 text-slate-300" />
                <span className="text-slate-450 italic normal-case tracking-normal">No pending invitations.</span>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Tabbed View (Connections/Followers/Following) (Col Span: 4) */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-5 w-full min-w-0">
          
          {/* Tabs header */}
          <div className="flex bg-slate-200/50 border border-slate-300/40 rounded-xl p-1 justify-between gap-1 overflow-x-auto scrollbar-thin">
            <button
              onClick={() => { setNetworkTab('connections'); setNetworkSearch(''); }}
              className={`flex-1 py-2 sm:py-1.5 px-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${networkTab === 'connections' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Connections
            </button>
            <button
              onClick={() => { setNetworkTab('followers'); setNetworkSearch(''); }}
              className={`flex-1 py-2 sm:py-1.5 px-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${networkTab === 'followers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Followers
            </button>
            <button
              onClick={() => { setNetworkTab('following'); setNetworkSearch(''); }}
              className={`flex-1 py-2 sm:py-1.5 px-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${networkTab === 'following' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Following
            </button>
          </div>

          {/* Tab search filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder={`Search ${networkTab}...`} 
              value={networkSearch}
              onChange={(e) => setNetworkSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 sm:py-2 border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-450 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* List display */}
          <div className="bg-white border border-slate-200 rounded-xl md:rounded-2xl shadow-xs overflow-hidden max-h-[360px] sm:max-h-[420px] overflow-y-auto">
            {loadingActiveList ? (
              [...Array(4)].map((_, idx) => (
                <div key={idx} className="p-4 border-b border-slate-100 flex gap-3 animate-pulse" />
              ))
            ) : activeList && activeList.length > 0 ? (
              activeList.map((item) => (
                <div 
                  key={item.id}
                  className="p-3 sm:p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-2 sm:gap-4"
                  onMouseEnter={() => setHoveredCard(item.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="flex gap-2.5 sm:gap-3 items-center min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <UserAvatar
                        user={item}
                        size="md"
                        isOnline={item.presenceStatus === 'online'}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 
                        onClick={() => navigate(`/profile/${item.profileSlug || item.username}`)}
                        className="text-xs font-black text-slate-900 hover:text-blue-600 transition-colors cursor-pointer truncate"
                      >
                        {item.fullName}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-semibold truncate leading-tight mt-0.5">{item.headline || 'Academic Researcher'}</p>
                    </div>
                  </div>

                  {/* Actions mapping based on active Tab */}
                  <div className="shrink-0 flex items-center gap-1 sm:gap-1.5">
                    {networkTab === 'connections' && (
                      <>
                        <button
                          onClick={() => navigate(`/messages?user=${item.id}`)}
                          className="p-2 sm:p-1.5 hover:bg-blue-50 text-blue-600 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-lg transition-all cursor-pointer"
                          title="Send Message"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeConnectionMutation.mutate({ connectionId: item.connectionId })}
                          className="p-2 sm:p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg transition-all cursor-pointer"
                          title="Remove Connection"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {networkTab === 'following' && (
                      <>
                        <button
                          onClick={() => navigate(`/messages?user=${item.id}`)}
                          className="p-2 sm:p-1.5 hover:bg-blue-50 text-blue-600 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-lg transition-all cursor-pointer"
                          title="Send Message"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => unfollowMutation.mutate({ userId: item.id })}
                          className="px-2 sm:px-2.5 py-1.5 sm:py-1 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 text-[9px] font-black uppercase rounded-lg hover:bg-rose-50 transition-all cursor-pointer whitespace-nowrap"
                        >
                          Unfollow
                        </button>
                      </>
                    )}

                    {networkTab === 'followers' && (
                      <>
                        <button
                          onClick={() => navigate(`/messages?user=${item.id}`)}
                          className="p-2 sm:p-1.5 hover:bg-blue-50 text-blue-600 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-lg transition-all cursor-pointer"
                          title="Send Message"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        {item.isFollowing ? (
                          <button
                            onClick={() => unfollowMutation.mutate({ userId: item.id })}
                            className="group px-2 sm:px-2.5 py-1.5 sm:py-1 border border-emerald-200 bg-emerald-50 text-emerald-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1"
                            title="Click to unfollow"
                          >
                            <UserCheck className="w-3 h-3 group-hover:hidden" />
                            <X className="w-3 h-3 hidden group-hover:block" />
                            <span className="group-hover:hidden">Following</span>
                            <span className="hidden group-hover:inline">Unfollow</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => followMutation.mutate({ userId: item.id })}
                            className="px-2 sm:px-2.5 py-1.5 sm:py-1 border border-blue-200 hover:bg-blue-600 text-blue-600 hover:text-white text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer whitespace-nowrap"
                          >
                            Follow Back
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-450 italic text-xs font-semibold">
                No items found.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. Bottom Spotlight Section — top researchers to connect with */}
      <div className="bg-white border border-slate-200 rounded-2xl md:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase truncate">Researcher Spotlight</h3>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-wider mt-0.5">Top-cited researchers in your collaborative network</p>
          </div>
          <Link to="/discover/researchers" state={{ fromNetwork: true }} className="text-xs font-bold text-blue-600 hover:underline flex items-center shrink-0">
            View All
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Responsive grid: 1 col on phones, 2 on small tablets, 4 on desktop.
            Swapped out the old horizontal-scroll carousel (easy to miss on
            mobile, awkward to scroll with a mouse on desktop) for a grid
            that lays every card out flat so nothing is hidden off-screen. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {loadingSuggestions ? (
            [...Array(4)].map((_, idx) => (
              <div key={idx} className="bg-slate-50/50 rounded-2xl p-4 sm:p-5 border border-slate-100 h-32 animate-pulse" />
            ))
          ) : suggestionsData && suggestionsData.length > 0 ? (
            suggestionsData.slice(0, 4).map((cand) => (
              <div 
                key={cand.user._id}
                className="bg-slate-50/60 hover:bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all duration-200 flex flex-col gap-3"
              >
                <div className="flex gap-3 items-start min-w-0">
                  <UserAvatar user={cand.user} size="md" showBorder />
                  <div className="min-w-0 flex-1">
                    <h4 
                      onClick={() => navigate(`/profile/${cand.user.profileSlug || cand.user.username}`)}
                      className="text-xs sm:text-sm font-black text-slate-900 hover:text-blue-600 transition-colors cursor-pointer truncate"
                    >
                      {cand.user.fullName}
                    </h4>
                    <p className="text-[9px] sm:text-[10px] text-slate-450 font-bold truncate uppercase tracking-wide leading-tight mt-0.5">
                      {cand.profile?.institution || 'Scholar'}
                    </p>
                    <p className="text-[9px] text-emerald-600 font-bold mt-1.5 uppercase tracking-widest flex items-center gap-1">
                      <Activity className="w-3 h-3 shrink-0" />
                      <span>Active Match</span>
                    </p>
                  </div>
                </div>

                {/* Full-width action button on its own row so it's an easy,
                    thumb-friendly tap target on mobile instead of a tiny
                    icon squeezed in beside the name. */}
                {cand.connectionStatus === 'pending_sent' ? (
                  <span className="w-full py-2 bg-amber-50 text-amber-600 text-[10px] font-black uppercase rounded-lg border border-amber-200 flex items-center justify-center gap-1.5 cursor-default">
                    <Mail className="w-3.5 h-3.5" />
                    Pending
                  </span>
                ) : cand.connectionStatus === 'connected' ? (
                  <span className="w-full py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-lg border border-emerald-200 flex items-center justify-center gap-1.5 cursor-default">
                    <UserCheck className="w-3.5 h-3.5" />
                    Connected
                  </span>
                ) : (
                  <button
                    onClick={() => connectMutation.mutate({ userId: cand.user._id })}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Connect
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-6 text-slate-450 italic text-xs font-semibold">
              No spotlight profiles available.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default NetworkPage;