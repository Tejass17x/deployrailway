import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Users, Search, AlertCircle, ArrowLeft } from 'lucide-react';
import connectionsService from '../../connections/services/connections.service';
import ConnectionCard from '../../connections/components/ConnectionCard';

// Shows the connections list of the profile currently being viewed
// (resolved from the route's :username, NOT the logged-in user).
const Connections = () => {
  const { username, profile } = useOutletContext();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [connectionsList, setConnectionsList] = useState([]);
  const [totalCount, setTotalCount] = useState(profile?.connectionsCount || 0);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['profile-connections', username, debouncedSearch],
    queryFn: async () => {
      const res = await connectionsService.getUserConnections(username, {
        limit: 12,
        search: debouncedSearch
      });
      return res.data;
    },
    enabled: !!username
  });

  useEffect(() => {
    if (data) {
      setConnectionsList(data.docs || []);
      setNextCursor(data.nextCursor);
      setHasNextPage(data.hasNextPage);
      if (typeof data.totalCount === 'number') {
        setTotalCount(data.totalCount);
      }
    }
  }, [data]);

  const loadMore = async () => {
    if (!nextCursor || isFetchingMore) return;
    setIsFetchingMore(true);
    try {
      const res = await connectionsService.getUserConnections(username, {
        limit: 12,
        cursor: nextCursor,
        search: debouncedSearch
      });
      if (res.success) {
        setConnectionsList((prev) => [...prev, ...res.data.docs]);
        setNextCursor(res.data.nextCursor);
        setHasNextPage(res.data.hasNextPage);
      }
    } catch (err) {
      console.error('Failed to load more connections:', err);
    } finally {
      setIsFetchingMore(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-5 rounded-3xl shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/profile/${username}`)}
            className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200 text-slate-500"
            title="Back to Profile"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h3 className="text-base font-black text-[#0F172A] tracking-tight uppercase flex items-center gap-2">
              <Users className="w-5 h-5 text-[#2563EB]" />
              <span>Connections ({totalCount})</span>
            </h3>
            <p className="text-[10px] text-[#475569] font-bold uppercase tracking-wider mt-0.5">
              This researcher's connected academic network
            </p>
          </div>
        </div>

        <div className="relative max-w-xs w-full">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search connections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-650 focus:border-transparent text-slate-900 placeholder-slate-400 font-bold rounded-xl"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 h-48 animate-pulse space-y-4">
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
      ) : connectionsList.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connectionsList.map((connection) => (
              <ConnectionCard
                key={connection._id}
                connection={connection}
                currentUserId={currentUser?._id}
              />
            ))}
          </div>

          {hasNextPage && (
            <button
              onClick={loadMore}
              disabled={isFetchingMore}
              className="w-full py-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-black text-[#475569] uppercase tracking-wider rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              {isFetchingMore ? 'Loading...' : 'Load More Connections'}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
          <h4 className="text-sm font-black text-slate-900 uppercase">No Connections Found</h4>
          <p className="text-xs text-[#475569] max-w-xs mx-auto font-semibold text-center">
            {debouncedSearch ? 'No connections match your query. Try another search.' : 'This researcher has not built any academic connections yet.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Connections;