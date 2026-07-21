import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Users, Search, AlertCircle } from 'lucide-react';
import followService from '../services/follow.service';
import FollowerCard from '../components/FollowerCard';
import FollowingCard from '../components/FollowingCard';

const CONFIG = {
  followers: {
    queryKey: 'followers',
    fetchFn: followService.getFollowers,
    Card: FollowerCard,
    cardProp: 'follower',
    countKey: 'followersCount',
    heading: 'Followers',
    subtitle: 'Researchers who follow this profile',
    searchPlaceholder: 'Search followers...',
    loadMoreLabel: 'Load More Followers',
    emptySearchText: 'No followers match your search criteria. Try a different query.',
    emptyText: 'This researcher does not have any followers yet.',
    emptyTitle: 'No Followers Found'
  },
  following: {
    queryKey: 'following',
    fetchFn: followService.getFollowing,
    Card: FollowingCard,
    cardProp: 'following',
    countKey: 'followingCount',
    heading: 'Following',
    subtitle: 'Researchers followed by this profile',
    searchPlaceholder: 'Search following...',
    loadMoreLabel: 'Load More Following',
    emptySearchText: 'No matching researchers. Try another search.',
    emptyText: 'This researcher is not following anyone yet.',
    emptyTitle: 'No Following Found'
  }
};

const FollowListPage = ({ type }) => {
  const { username, profile } = useOutletContext();
  const currentUser = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const location = useLocation();

  // URL is the source of truth for which tab is active, so both direct
  // links (/followers, /following) and in-page switching stay in sync.
  const activeTab = location.pathname.endsWith('/following') ? 'following' : 'followers';
  const cfg = CONFIG[activeTab];

  const switchTab = (nextTab) => {
    if (nextTab === activeTab) return;
    navigate(`/profile/${username}/${nextTab}`, { replace: true });
  };

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [list, setList] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400); // 400ms debounce
    return () => clearTimeout(handler);
  }, [search]);

  // Reset search/list state when switching between Followers and Following
  useEffect(() => {
    setSearch('');
    setDebouncedSearch('');
    setList([]);
    setNextCursor(null);
    setHasNextPage(false);
  }, [activeTab]);

  // Fetch initial list when username or search term changes
  const { data, isLoading, refetch } = useQuery({
    queryKey: [cfg.queryKey, username, debouncedSearch],
    queryFn: async () => {
      const res = await cfg.fetchFn(username, {
        limit: 12,
        search: debouncedSearch
      });
      return res.data;
    },
    enabled: !!username
  });

  useEffect(() => {
    if (data) {
      setList(data.docs || []);
      setNextCursor(data.nextCursor);
      setHasNextPage(data.hasNextPage);
    }
  }, [data]);

  const loadMore = async () => {
    if (!nextCursor || isFetchingMore) return;
    setIsFetchingMore(true);
    try {
      const res = await cfg.fetchFn(username, {
        limit: 12,
        cursor: nextCursor,
        search: debouncedSearch
      });
      if (res.success) {
        setList((prev) => [...prev, ...res.data.docs]);
        setNextCursor(res.data.nextCursor);
        setHasNextPage(res.data.hasNextPage);
      }
    } catch (err) {
      console.error(`Failed to load more ${cfg.queryKey}:`, err);
    } finally {
      setIsFetchingMore(false);
    }
  };

  const Card = cfg.Card;

  return (
    <div className="space-y-6">

      {/* Tab Switcher */}
      <div className="flex gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl w-fit">
        {Object.keys(CONFIG).map((tab) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-colors ${
              activeTab === tab
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {CONFIG[tab].heading} ({profile?.[CONFIG[tab].countKey] || 0})
          </button>
        ))}
      </div>

      {/* Header and Search bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-5 rounded-3xl shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
        <div>
          <h3 className="text-base font-black text-[#0F172A] tracking-tight uppercase flex items-center gap-2">
            <Users className="w-5 h-5 text-[#2563EB]" />
            <span>{cfg.heading} ({profile?.[cfg.countKey] || 0})</span>
          </h3>
          <p className="text-[10px] text-[#475569] font-bold uppercase tracking-wider mt-0.5">{cfg.subtitle}</p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder={cfg.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-650 focus:border-transparent text-slate-900 placeholder-slate-400 font-bold rounded-xl"
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 h-44 animate-pulse space-y-4">
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-slate-100 rounded-full shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-8 bg-slate-100 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : list.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((item) => (
              <Card
                key={item._id}
                {...{ [cfg.cardProp]: item }}
                currentUserId={currentUser?._id}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasNextPage && (
            <button
              onClick={loadMore}
              disabled={isFetchingMore}
              className="w-full py-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-black text-[#475569] uppercase tracking-wider rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              {isFetchingMore ? 'Loading...' : cfg.loadMoreLabel}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto opacity-50 animate-pulse" />
          <h4 className="text-sm font-black text-slate-900 uppercase">{cfg.emptyTitle}</h4>
          <p className="text-xs text-[#475569] max-w-xs mx-auto font-semibold">
            {debouncedSearch ? cfg.emptySearchText : cfg.emptyText}
          </p>
        </div>
      )}
    </div>
  );
};

export default FollowListPage;