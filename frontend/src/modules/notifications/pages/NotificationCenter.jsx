import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

import { useNotifications } from '../../../hooks/useNotifications';

// Components
import NotificationHeroSection from '../components/NotificationHeroSection';
import NotificationStatsGrid from '../components/NotificationStatsGrid';
import NotificationFilterBar from '../components/NotificationFilterBar';
import NotificationFeed from '../components/NotificationFeed';
import NotificationRightSidebar from '../components/NotificationRightSidebar';
import { HeroSkeleton } from '../components/NotificationSkeletons';

// ── Filter helpers ────────────────────────────────────────────────────────────
const FILTER_TYPE_MAP = {
  citations: 'citation',
  mentions: 'mention',
  reviews: 'review',
  system: 'system',
  messages: 'message',
  projects: 'project',
  follow: 'follow',
  collab: 'collab',
  funding: 'funding',
  research: 'research',
};

const applyFilters = (list, filters, activeCategory) => {
  let result = [...list];

  // 1. Category Panel Filter
  if (activeCategory !== 'all' && activeCategory !== 'archived') {
    const t = FILTER_TYPE_MAP[activeCategory] || activeCategory.replace(/s$/, ''); // very basic mapping
    // E.g. 'mentions' -> 'mention', 'citations' -> 'citation', 'reviews' -> 'review'
    result = result.filter(n =>
      n.type === t ||
      (t === 'collab' && n.type === 'system') ||
      (t === 'publications' && n.type === 'citation')
    );
  } else if (activeCategory === 'archived') {
    // Dummy check for archived, usually handled separately
    result = [];
  }

  // 2. Toolbar: Search
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(n =>
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.description && n.description.toLowerCase().includes(q))
    );
  }

  // Toolbar: Date Range
  if (filters.dateRange && filters.dateRange !== 'all') {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    result = result.filter(n => {
      if (!n.createdAt) return false;
      const d = new Date(n.createdAt);
      if (filters.dateRange === 'today') return d >= today;
      if (filters.dateRange === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return d >= yesterday && d < today;
      }
      if (filters.dateRange === '7d') {
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        return d >= last7;
      }
      if (filters.dateRange === '30d') {
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 30);
        return d >= last30;
      }
      if (filters.dateRange === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (filters.dateRange === 'year') {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }

  // 3. Toolbar: Type
  if (filters.type && filters.type !== 'all') {
    const typeMap = {
      citation: ['citation'],
      mention: ['mention'],
      project: ['project'],
      system: ['system'],
      message: ['message'],
      review: ['review'],
      follow: ['system'],
      research: ['system'],
      update: ['system'],
      invitation: ['system'],
      application: ['system'],
      funding: ['system'],
      journal: ['system']
    };
    const allowedTypes = typeMap[filters.type] || [filters.type];
    result = result.filter(n => allowedTypes.includes(n.type));
  }

  // 4. Toolbar: Priority
  if (filters.priority && filters.priority !== 'All') {
    result = result.filter(n => (n.priority || 'Low').toLowerCase() === filters.priority.toLowerCase());
  }

  // 5. Toolbar: Status
  if (filters.status !== 'All') {
    if (filters.status === 'Unread') result = result.filter(n => !n.isRead);
    if (filters.status === 'Read') result = result.filter(n => n.isRead);
    if (filters.status === 'Starred') result = result.filter(n => n.isStarred);
    if (filters.status === 'Archived') result = [];
  }

  // 6. Toolbar: Sort (assuming newest by default)
  if (filters.sort === 'oldest') {
    result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  } else if (filters.sort === 'newest') {
    // Do nothing or sort desc
  }

  return result;
};

// ── Main Page Component ───────────────────────────────────────────────────────
const NotificationCenter = () => {
  // Global category state (left sidebar)
  const [activeFilter, setActiveFilter] = useState('all');

  // Advanced toolbar state
  const [toolbarFilters, setToolbarFilters] = useState({
    search: '',
    dateRange: 'all',
    type: 'all',
    priority: 'All',
    status: 'All',
    sort: 'newest',
  });

  const [showToast, setShowToast] = useState(false);

  const {
    notifications, // raw flat list needed for sidebar
    dateGrouped,
    stats,
    isLoading,
    isFetching,
    markAsRead,
    markAllRead,
    dismissNotification,
    isMarkingAllRead,
    refetch,
  } = useNotifications();

  // Apply filters
  const today = useMemo(() => applyFilters(dateGrouped.today, toolbarFilters, activeFilter), [dateGrouped.today, toolbarFilters, activeFilter]);
  const yesterday = useMemo(() => applyFilters(dateGrouped.yesterday, toolbarFilters, activeFilter), [dateGrouped.yesterday, toolbarFilters, activeFilter]);
  const older = useMemo(() => applyFilters(dateGrouped.older, toolbarFilters, activeFilter), [dateGrouped.older, toolbarFilters, activeFilter]);

  const totalFiltered = today.length + yesterday.length + older.length;

  const handleMarkAllRead = () => {
    markAllRead();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  return (
    <div className="min-h-[calc(100vh-112px)] md:min-h-[calc(100vh-128px)] bg-[#F8FAFC] font-sans pb-12">

      {/* ── Success toast ─────────────────────────────────────────────────── */}
      <div
        className="fixed bottom-6 right-6 bg-white border border-[#E2E8F0] shadow-2xl rounded-2xl p-4 pr-6 flex items-center gap-3 z-[999] max-w-sm"
        style={{
          transform: showToast ? 'translateX(0) scale(1)' : 'translateX(130%) scale(0.9)',
          opacity: showToast ? 1 : 0,
          transition: 'all 350ms cubic-bezier(0.34,1.2,0.64,1)',
        }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#22C55E] rounded-l-2xl" />
        <div className="w-8 h-8 rounded-full bg-[#DCFCE7] flex items-center justify-center shrink-0">
          <CheckCircle className="w-4 h-4 text-[#22C55E]" />
        </div>
        <div>
          <p className="text-[#0F172A] font-semibold text-sm">All caught up!</p>
          <p className="text-[#94A3B8] text-xs">All notifications marked as read</p>
        </div>
      </div>

      {/* ── TOP AREA (HERO + GRID) ─────────────────────────────────── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 relative z-20">
        {isLoading ? (
          <HeroSkeleton />
        ) : (
          <NotificationHeroSection
            stats={stats}
            isMarkingAllRead={isMarkingAllRead}
            isFetching={isFetching}
            onMarkAllRead={handleMarkAllRead}
            onRefresh={refetch}
          />
        )}

        <NotificationStatsGrid 
          stats={stats} 
          isLoading={isLoading} 
          activeFilter={activeFilter}
          onCardClick={setActiveFilter}
        />
      </div>

      {/* ── MAIN LAYOUT (FEED + RIGHT SIDEBAR) ───────────────────────── */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 mt-2 lg:mt-6">
        <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start relative">

          {/* Center Column (Feed & Filters) */}
          <div id="notification-feed-start" className="flex-1 min-w-0">
            <div className="mb-4 lg:mb-6">
              <NotificationFilterBar
                filters={toolbarFilters}
                setFilters={setToolbarFilters}
                totalResults={totalFiltered}
              />
            </div>

            <div className="pb-6">
              <NotificationFeed
                isLoading={isLoading}
                isFetching={isFetching}
                today={today}
                yesterday={yesterday}
                older={older}
                activeFilter={activeFilter}
                onDismiss={dismissNotification}
                onMarkRead={markAsRead}
                onRefetch={refetch}
                weeklyStats={{
                  weeklyReads: stats.weeklyReads,
                  weeklyCitations: stats.weeklyCitations,
                  weeklyBars: stats.weeklyBars,
                }}
                setActiveFilter={setActiveFilter}
              />
            </div>
          </div>

          {/* Right Column (Sticky Sidebar XL only) */}
          <div className="hidden xl:block w-[320px] flex-shrink-0 lg:sticky lg:top-6 lg:self-start">
            {isLoading ? (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-3 h-[400px] animate-pulse" />
            ) : (
              <NotificationRightSidebar
                notifications={notifications}
                stats={stats}
                onMarkAllRead={handleMarkAllRead}
                isMarkingAllRead={isMarkingAllRead}
              />
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
