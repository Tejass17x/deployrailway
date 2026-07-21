import React, { useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Home, Compass, Users, FolderOpen, Bookmark, MessageSquare,
  User, TrendingUp, Bell, PlusCircle, RefreshCw, Search,
  ChevronRight, Settings, Sparkles, Loader2
} from 'lucide-react';

import feedService from '../../../services/feed.service';
import FeedFilters from '../components/FeedFilters';
import InfiniteFeed from '../components/InfiniteFeed';
import FeedEventCard from '../components/FeedEventCard';
import SidebarTrendingAreas from '../components/SidebarTrendingAreas';
import SidebarSuggestedResearchers from '../components/SidebarSuggestedResearchers';
import SidebarConferences from '../components/SidebarConferences';
import SidebarFunding from '../components/SidebarFunding';
import SidebarJobs from '../components/SidebarJobs';

const NAV_LINKS = [
  { to: '/',              icon: Home,         label: 'Home' },
  { to: '/discover',      icon: Compass,      label: 'Discover' },
  { to: '/collaborations',icon: FolderOpen,   label: 'Projects' },
  { to: '/bookmarks',     icon: Bookmark,     label: 'Bookmarks' },
  { to: '/messages',      icon: MessageSquare,label: 'Messages' },
  { to: '/profile',       icon: User,         label: 'Profile' },
];

// ─── Feed Fetcher Hook ────────────────────────────────────────────────────────
function useCursorFeed(tab) {
  const [events, setEvents] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const tabRef = useRef(tab);

  const reset = useCallback(() => {
    setEvents([]);
    setCursor(null);
    setHasMore(true);
  }, []);

  const fetchPage = useCallback(async (nextCursor, currentTab) => {
    if (loading) return;
    setLoading(true);
    try {
      let res;
      const opts = { cursor: nextCursor, limit: 20 };
      if (currentTab === 'for-you')    res = await feedService.getActivityFeed(opts);
      else if (currentTab === 'following')  res = await feedService.getActivityFeedFollowing(opts);
      else if (currentTab === 'trending')   res = await feedService.getActivityFeedTrending(opts);
      else if (currentTab === 'latest')     res = await feedService.getActivityFeedLatest(opts);
      // community / connections / bookmarks fall through to for-you
      else res = await feedService.getActivityFeed(opts);

      if (res?.success) {
        const { events: newEvents = [], nextCursor: nc } = res.data || {};
        setEvents(prev => nextCursor ? [...prev, ...newEvents] : newEvents);
        setCursor(nc || null);
        setHasMore(!!nc);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('[HomeFeedV2] fetchPage error:', err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // On tab change: reset and fetch fresh
  React.useEffect(() => {
    if (tabRef.current !== tab) {
      tabRef.current = tab;
      reset();
    }
    fetchPage(null, tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && cursor) {
      fetchPage(cursor, tabRef.current);
    }
  }, [loading, hasMore, cursor, fetchPage]);

  const refresh = useCallback(() => {
    reset();
    fetchPage(null, tabRef.current);
  }, [reset, fetchPage]);

  return { events, hasMore, loading, loadMore, refresh };
}

// ─── HomeFeedV2 ───────────────────────────────────────────────────────────────
const HomeFeedV2 = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile } = useSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState('for-you');

  const { events, hasMore, loading, loadMore, refresh } = useCursorFeed(activeTab);

  // Sidebar data — cached 5 minutes
  const { data: sidebarData } = useQuery({
    queryKey: ['feedSidebar'],
    queryFn: async () => {
      const res = await feedService.getFeedSidebar();
      return res?.success ? res.data : {};
    },
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInteraction = useCallback(async (eventId, type) => {
    try {
      await feedService.recordInteraction(eventId, type);
    } catch { /* non-critical */ }
  }, []);

  const avatarUrl = profile?.profileImage || user?.profileImage;
  const displayName = profile?.firstName || user?.firstName || 'Researcher';

  return (
    <div className="min-h-screen bg-bg-page text-text-primary">
      <div className="max-w-screen-xl mx-auto px-4 py-6 flex gap-6">

        {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col gap-3 w-56 xl:w-64 shrink-0 sticky top-6 self-start h-fit">
          {/* User Card */}
          <div
            className="bg-bg-card border border-border-default rounded-2xl p-4 cursor-pointer hover:border-primary/30 transition-all"
            onClick={() => navigate('/profile')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center overflow-hidden shrink-0">
                {avatarUrl
                  ? <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  : <span className="text-sm font-bold text-primary">{displayName[0]?.toUpperCase()}</span>}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-text-primary truncate">{displayName}</p>
                <p className="text-xs text-text-muted truncate">{profile?.designation || 'Researcher'}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="bg-bg-card border border-border-default rounded-2xl p-2 flex flex-col gap-0.5">
            {NAV_LINKS.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-muted hover:bg-bg-surface hover:text-text-primary'
                  }`
                }
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Quick create */}
          <button
            onClick={() => navigate('/publications/upload')}
            className="flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-2xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 justify-center"
          >
            <PlusCircle size={16} />Publish Research
          </button>
        </aside>

        {/* ── Center Feed ───────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 max-w-2xl mx-auto lg:mx-0">
          {/* Feed header */}
          <div className="bg-bg-card border border-border-default rounded-2xl mb-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
              <h1 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Sparkles size={17} className="text-primary" />Research Feed
              </h1>
              <button
                onClick={refresh}
                className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-bg-surface"
              >
                <RefreshCw size={13} />Refresh
              </button>
            </div>
            <FeedFilters activeTab={activeTab} onTabChange={handleTabChange} className="px-2 pt-1" />
          </div>

          {/* Feed */}
          <InfiniteFeed
            events={events}
            hasMore={hasMore}
            loading={loading}
            onLoadMore={loadMore}
            onRefresh={refresh}
            renderItem={(event) => (
              <FeedEventCard
                key={String(event._id)}
                event={event}
                onInteraction={handleInteraction}
              />
            )}
            emptyTitle="Your feed is empty"
            emptySubtitle="Follow researchers to populate your feed."
          />
        </main>

        {/* ── Right Sidebar ─────────────────────────────────────────────────── */}
        <aside className="hidden xl:flex flex-col gap-4 w-72 shrink-0 sticky top-6 self-start h-fit">
          {sidebarData?.trendingAreas?.length > 0 && (
            <SidebarTrendingAreas areas={sidebarData.trendingAreas} />
          )}
          {sidebarData?.suggestedResearchers?.length > 0 && (
            <SidebarSuggestedResearchers
              researchers={sidebarData.suggestedResearchers}
              onFollow={() => queryClient.invalidateQueries({ queryKey: ['feedSidebar'] })}
            />
          )}
          {sidebarData?.conferences?.length > 0 && (
            <SidebarConferences conferences={sidebarData.conferences} />
          )}
          {sidebarData?.funding?.length > 0 && (
            <SidebarFunding funding={sidebarData.funding} />
          )}
          {sidebarData?.jobs?.length > 0 && (
            <SidebarJobs jobs={sidebarData.jobs} />
          )}

          {/* Footer links */}
          <div className="text-xs text-text-muted space-x-2 px-1">
            <span>© 2025 Research Connect</span>
            <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default HomeFeedV2;
