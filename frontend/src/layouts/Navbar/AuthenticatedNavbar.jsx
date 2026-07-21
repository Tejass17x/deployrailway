import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logoutSuccess } from '../../redux/slices/authSlice';
import authService from '../../services/auth.service';
import connectionsService from "../../modules/connections/services/connections.service";
import searchService from '../../services/search.service';
import { setQuery } from '../../redux/slices/searchSlice';
import { setChatOpen } from '../../redux/slices/messageSlice';
import NotificationBell from "../../modules/notifications/components/NotificationBell";
import {
  Bell, MessageSquare, UserPlus, Plus, ChevronDown,
  Search, LogOut, User, Compass, X,
  FileText, Briefcase, Award, Settings, BookOpen, HelpCircle,
  Share2, Users, Bookmark, Menu
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import UserAvatar from '../../components/ui/Avatar';

const AuthenticatedNavbar = ({ onMenuClick, isMobileMenuOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { user, profile } = useSelector((state) => state.auth);
  const searchState = useSelector((state) => state.search);

  const { data: receivedRequests } = useQuery({
    queryKey: ['connectionRequests', 'received'],
    queryFn: async () => {
      const res = await connectionsService.getReceivedRequests();
      return res.data || [];
    },
    enabled: !!user
  });

  // Same source HomeFeed's "Welcome back, {name}" uses: state.auth.user
  // firstName/lastName. user.fullName is a separate, stale field — don't use it.
  const displayName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      return await connectionsService.acceptConnectionRequest(requestId);
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Connection request accepted!');
        queryClient.invalidateQueries({ queryKey: ['connectionRequests'] });
        queryClient.invalidateQueries({ queryKey: ['connections'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
    }
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      return await connectionsService.rejectConnectionRequest(requestId);
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Connection request ignored.');
        queryClient.invalidateQueries({ queryKey: ['connectionRequests'] });
      }
    }
  });

  const [profileOpen, setProfileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [reqOpen, setReqOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);

  const profileRef = useRef(null);
  const createRef = useRef(null);
  const reqRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (createRef.current && !createRef.current.contains(e.target)) setCreateOpen(false);
      if (reqRef.current && !reqRef.current.contains(e.target)) setReqOpen(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!searchState.query || searchState.query.trim().length < 2) {
      setSuggestions(null);
      setIsSearchingSuggestions(false);
      return;
    }

    setIsSearchingSuggestions(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await searchService.getAutocomplete(searchState.query);
        setSuggestions(data);
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchState.query]);

  // Clear search box when navigating away from the search page
  useEffect(() => {
    if (location.pathname !== '/search' && searchState.query) {
      dispatch(setQuery(''));
    }
  }, [location.pathname]); // Only run when pathname changes

  // Auto-search as you type (only on /search page)
  useEffect(() => {
    if (location.pathname === '/search') {
      const delayDebounceFn = setTimeout(() => {
        const trimmed = searchState.query.trim();
        const currentParams = new URLSearchParams(location.search);
        
        if (trimmed) {
          if (currentParams.get('q') !== trimmed) {
            navigate(`/search?q=${encodeURIComponent(trimmed)}`, { replace: true });
          }
        } else {
          if (currentParams.has('q')) {
            navigate('/search', { replace: true });
          }
        }
      }, 500); // 500ms debounce
      
      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchState.query, location.pathname, location.search, navigate]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout API failed:', err);
    } finally {
      dispatch(logoutSuccess());
      toast.success('Logged out successfully');
      navigate('/');
    }
  };

  const handleSearchChange = (e) => {
    dispatch(setQuery(e.target.value));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    
    const trimmedQuery = searchState.query.trim();
    if (trimmedQuery) {
      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    } else if (window.location.pathname === '/search') {
      // Reset search if the input is cleared and submitted on the search page
      navigate('/search');
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300">
      <div className="max-w-[95%] xl:max-w-[92%] mx-auto px-1 sm:px-4 lg:px-6">
        {mobileSearchOpen ? (
          <div className="flex items-center h-16 gap-2 md:hidden">
            <form onSubmit={handleSearchSubmit} className="flex-grow relative">
              <input
                autoFocus
                type="text"
                placeholder="Search researchers, papers..."
                value={searchState.query}
                onChange={handleSearchChange}
                className="w-full pl-4 pr-11 py-2.5 rounded-full border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-950 placeholder-slate-400"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                aria-label="Submit search"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
            <button
              onClick={() => setMobileSearchOpen(false)}
              className="flex-shrink-0 p-2.5 rounded-full hover:bg-slate-100 text-slate-500"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
        <div className="flex items-center justify-between h-16 gap-1 sm:gap-4">

          {/* Logo - Far Left */}
          <div className="flex-shrink-0 flex items-center -ml-1 sm:-ml-2 gap-1">
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-all shrink-0"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
            <Link to="/" className="flex items-center gap-0.5 sm:gap-1.5">
              <span className="flex p-1 sm:p-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white items-center justify-center shrink-0">
                <Share2 className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </span>
              <span className="font-bold text-[10px] sm:text-xl tracking-tight text-slate-900 whitespace-nowrap">
                Research <span className="text-blue-600">Connect</span>
              </span>
            </Link>
          </div>

          {/* Large Global Search with Autocomplete */}
          <div ref={searchContainerRef} className="flex-grow max-w-xl relative hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Search researchers, papers, patents, keywords..."
                value={searchState.query}
                onChange={handleSearchChange}
                onFocus={() => {
                  setShowSuggestions(true);
                  if (window.location.pathname !== '/search') {
                    navigate('/search' + (searchState.query ? `?q=${encodeURIComponent(searchState.query)}` : ''));
                  }
                }}
                className="w-full pl-5 pr-12 py-2 rounded-full border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-950 placeholder-slate-400 shadow-inner hover:bg-slate-100/50 focus:bg-white transition-all duration-200"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors cursor-pointer z-10"
                aria-label="Submit search"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {showSuggestions && (searchState.query.trim().length >= 2) && (isSearchingSuggestions || (suggestions && Object.values(suggestions).some(arr => Array.isArray(arr) && arr.length > 0))) && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-[420px] overflow-y-auto">
                {isSearchingSuggestions ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-xs font-semibold text-slate-400">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </div>
                ) : (
                  <div className="py-2.5 divide-y divide-slate-100">
                    {suggestions.authors && suggestions.authors.length > 0 && (
                      <div className="py-2">
                        <div className="px-4 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">Researchers</div>
                        <div className="mt-1 space-y-0.5">
                          {suggestions.authors.map((author, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setShowSuggestions(false);
                                navigate(`/profile/${author.profileSlug || author.username || author.name}`);
                              }}
                              className="w-full px-4 py-2 hover:bg-slate-50 text-left flex items-center gap-3 transition-colors group cursor-pointer"
                            >
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                                {author.name?.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 truncate">{author.name}</p>
                                {author.institution && (
                                  <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">{author.institution}</p>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {suggestions.publications && suggestions.publications.length > 0 && (
                      <div className="py-2">
                        <div className="px-4 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">Publications</div>
                        <div className="mt-1 space-y-0.5">
                          {suggestions.publications.map((pub) => (
                            <button
                              key={pub.id}
                              onClick={() => {
                                setShowSuggestions(false);
                                navigate(`/publications/${pub.slug || pub.id}`);
                              }}
                              className="w-full px-4 py-2 hover:bg-slate-50 text-left flex items-start gap-3 transition-colors group cursor-pointer"
                            >
                              <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0 group-hover:text-blue-600" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 line-clamp-1 leading-snug">{pub.title}</p>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                  {pub.type ? `${pub.type.charAt(0).toUpperCase() + pub.type.slice(1)}` : 'Paper'} • {pub.year || 'N/A'}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {suggestions.keywords && suggestions.keywords.length > 0 && (
                      <div className="py-2">
                        <div className="px-4 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">Keywords / Areas</div>
                        <div className="mt-1 flex flex-wrap gap-1.5 px-4 py-1">
                          {suggestions.keywords.map((kw, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setShowSuggestions(false);
                                dispatch(setQuery(kw));
                                navigate(`/search?q=${encodeURIComponent(kw)}`);
                              }}
                              className="text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 px-2.5 py-1 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              {kw}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-1">
                      <button
                        onClick={() => {
                          setShowSuggestions(false);
                          navigate(`/search?q=${encodeURIComponent(searchState.query)}`);
                        }}
                        className="w-full py-2 hover:bg-blue-50 text-blue-600 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5" />
                        Search all results for "{searchState.query}"
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Utility Buttons - spaced out */}
          <div className="flex items-center gap-x-1.5 sm:gap-x-2.5 md:gap-x-4">

            {/* Mobile Search Trigger */}
            <button
              onClick={() => {
                setMobileSearchOpen(true);
                if (window.location.pathname !== '/search') {
                  navigate('/search' + (searchState.query ? `?q=${encodeURIComponent(searchState.query)}` : ''));
                }
              }}
              className="p-1 sm:p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-all md:hidden shrink-0"
              aria-label="Search"
            >
              <Search className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
            </button>

            {/* Create Dropdown */}
            <div className="relative shrink-0" ref={createRef}>
              <button
                onClick={() => setCreateOpen(!createOpen)}
                className="flex items-center gap-0.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] sm:text-xs px-0.5 py-1.5 sm:px-2.5 sm:py-1.5 rounded-md shadow-sm active:scale-[0.98] transition-all"
              >
                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Create</span>
                <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-80" />
              </button>
              {createOpen && (
                <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-auto mt-0 sm:mt-2 w-60 max-h-[75vh] sm:max-h-none overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-left text-sm font-semibold text-slate-700">
                  <button onClick={() => { setCreateOpen(false); navigate('/publications/create'); }} className="w-full px-4 py-2.5 hover:bg-slate-55 hover:text-blue-600 text-left flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" /> Upload Publication
                  </button>
                  <button onClick={() => { setCreateOpen(false); navigate('/projects/create'); }} className="w-full px-4 py-2.5 hover:bg-slate-55 hover:text-blue-600 text-left flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400 shrink-0" /> Create Research Project
                  </button>
                  <button onClick={() => { setCreateOpen(false); navigate('/collaborations/create'); }} className="w-full px-4 py-2.5 hover:bg-slate-55 hover:text-blue-600 text-left flex items-center gap-2">
                    <Plus className="w-4 h-4 text-slate-400 shrink-0" /> Create Collaboration
                  </button>
                  <button onClick={() => { setCreateOpen(false); navigate('/patents/create'); }} className="w-full px-4 py-2.5 hover:bg-slate-55 hover:text-blue-600 text-left flex items-center gap-2">
                    <Award className="w-4 h-4 text-slate-400 shrink-0" /> Upload Patent
                  </button>
                  <button onClick={() => { setCreateOpen(false); navigate('/articles/create'); }} className="w-full px-4 py-2.5 hover:bg-slate-55 hover:text-blue-600 text-left flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" /> Write Article
                  </button>
                  <button onClick={() => { setCreateOpen(false); navigate('/events/create'); }} className="w-full px-4 py-2.5 hover:bg-slate-55 hover:text-blue-600 text-left flex items-center gap-2">
                    <Compass className="w-4 h-4 text-slate-400 shrink-0" /> Create Event
                  </button>
                </div>
              )}
            </div>

            {/* Requests, Messages, Notifications - spaced out */}
            <div className="flex items-center gap-x-1 sm:gap-x-1.5 md:gap-x-2.5">
              {/* Requests - hidden on mobile, shown inside Notifications dropdown instead */}
              <div className="relative shrink-0 hidden md:block" ref={reqRef}>
                <button
                  onClick={() => setReqOpen(!reqOpen)}
                  className="p-1.5 sm:p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-all relative cursor-pointer"
                  title="Requests"
                >
                  <UserPlus className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                  {receivedRequests && receivedRequests.length > 0 && (
                    <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full animate-pulse"></span>
                  )}
                </button>
                {reqOpen && (
                  <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-auto mt-0 sm:mt-2 w-64 sm:w-80 max-h-[75vh] sm:max-h-none overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-4">
                    <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2 mb-2 flex items-center justify-between sticky top-0 bg-white">
                      <span>Pending Requests</span>
                      {receivedRequests && receivedRequests.length > 0 && (
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-black uppercase">
                          {receivedRequests.length} New
                        </span>
                      )}
                    </h4>
                    <div className="space-y-3 max-h-72 overflow-y-auto">
                      {receivedRequests && receivedRequests.length > 0 ? (
                        receivedRequests.map(req => (
                          <div key={req._id} className="text-xs border-b border-slate-50 pb-2.5 last:border-0 last:pb-0 text-left space-y-1">
                            <p className="font-bold text-slate-800">{req.user?.fullName}</p>
                            {req.profile?.headline && (
                              <p className="text-slate-400 text-[10px] truncate font-semibold">{req.profile.headline}</p>
                            )}
                            {req.note && (
                              <p
                                className="text-slate-500 mt-1 bg-slate-55 p-1.5 rounded-lg italic truncate"
                                title={req.note}
                              >
                                "{req.note}"
                              </p>
                            )}
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => acceptRequestMutation.mutate(req._id)}
                                disabled={acceptRequestMutation.isPending}
                                className="bg-blue-600 text-white font-bold px-3 py-1 rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => rejectRequestMutation.mutate(req._id)}
                                disabled={rejectRequestMutation.isPending}
                                className="bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-lg hover:bg-slate-200 cursor-pointer transition-colors"
                              >
                                Ignore
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic py-2 text-center">No pending requests.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Messages */}
              <Link
                to="/messages"
                className="p-1.5 sm:p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-all relative flex items-center justify-center shrink-0"
                title="Messages"
              >
                <MessageSquare className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-600 rounded-full"></span>
              </Link>

              {/* Notifications */}
              <NotificationBell />
            </div>

            {/* Profile Dropdown */}
            <div className="relative shrink-0" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-0.5 sm:gap-1.5 p-0.5 sm:p-1 pr-1 sm:pr-2.5 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus:outline-none transition-all duration-200 shadow-sm group"
              >
                <UserAvatar
                  user={user}
                  src={profile?.profileImage}
                  size="sm"
                  className="shrink-0"
                />
                <span className="hidden lg:block text-xs font-bold text-slate-700 group-hover:text-blue-600 max-w-[90px] truncate transition-colors duration-150">
                  {displayName.split(' ')[0] || ''}
                </span>
                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 group-hover:text-blue-600 transition-colors duration-150 shrink-0" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 max-w-[90vw] bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 text-left text-sm font-semibold text-slate-700">
                  <div className="px-4 py-2 border-b border-slate-150">
                    <p className="font-extrabold text-slate-900 truncate">{displayName || 'Researcher'}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email}</p>
                  </div>
                  <div className="py-1 grid grid-cols-1 gap-0.5">
                    <Link to={user?.profileSlug ? `/profile/${user.profileSlug}` : '/profile'} onClick={() => setProfileOpen(false)} className="px-4 py-2 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors">
                      <User className="w-4 h-4 text-slate-400" /> My Profile
                    </Link>
                    <Link to="/help" onClick={() => setProfileOpen(false)} className="px-4 py-2 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors">
                      <HelpCircle className="w-4 h-4 text-slate-400" /> Help Center
                    </Link>
                  </div>
                  <div className="border-t border-slate-150 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-red-600 font-bold hover:bg-red-50 hover:text-red-700 flex items-center gap-2.5 transition-colors rounded-lg"
                    >
                      <LogOut className="w-4 h-4 text-red-500" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
        )}
      </div>
    </nav>
  );
};

export default AuthenticatedNavbar;