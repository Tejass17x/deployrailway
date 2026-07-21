import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Flame, Clock, ChevronDown } from 'lucide-react';
import InfiniteFeed from '../components/InfiniteFeed';
import FeedEventCard from '../components/FeedEventCard';
import feedService from '../../../services/feed.service';

const WINDOWS = [
  { label: 'Last 24h', value: 24 },
  { label: 'Last 48h', value: 48 },
  { label: 'Last 7 days', value: 168 },
];

const TrendingFeed = () => {
  const [windowHours, setWindowHours] = useState(24);
  const [events, setEvents] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showWindowMenu, setShowWindowMenu] = useState(false);

  const fetchPage = useCallback(async (nextCursor, wh = windowHours) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await feedService.getActivityFeedTrending({ cursor: nextCursor, limit: 20, windowHours: wh });
      if (res?.success) {
        const { events: newEvts = [], nextCursor: nc } = res.data || {};
        setEvents(prev => nextCursor ? [...prev, ...newEvts] : newEvts);
        setCursor(nc || null);
        setHasMore(!!nc);
      } else setHasMore(false);
    } catch { setHasMore(false); }
    finally { setLoading(false); }
  }, [loading, windowHours]);

  const reset = useCallback((wh) => {
    setEvents([]); setCursor(null); setHasMore(true);
    fetchPage(null, wh);
  }, [fetchPage]);

  React.useEffect(() => { fetchPage(null, windowHours); }, []); // eslint-disable-line

  const handleWindowChange = (wh) => {
    setWindowHours(wh);
    setShowWindowMenu(false);
    reset(wh);
  };

  const currentLabel = WINDOWS.find(w => w.value === windowHours)?.label || 'Last 24h';

  return (
    <div className="min-h-screen bg-bg-page text-text-primary">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-bg-card border border-border-default rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Flame size={20} className="text-orange-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary">Trending Research</h1>
                <p className="text-xs text-text-muted">Most engaged content in the research community</p>
              </div>
            </div>

            {/* Time window picker */}
            <div className="relative">
              <button
                onClick={() => setShowWindowMenu(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-2 bg-bg-surface border border-border-default rounded-xl text-xs font-medium text-text-primary hover:border-primary/30 transition-all"
              >
                <Clock size={13} className="text-orange-400" />
                {currentLabel}
                <ChevronDown size={12} className={`transition-transform ${showWindowMenu ? 'rotate-180' : ''}`} />
              </button>
              {showWindowMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-0 top-full mt-2 bg-bg-card border border-border-default rounded-xl shadow-xl overflow-hidden z-20 w-36"
                >
                  {WINDOWS.map(w => (
                    <button
                      key={w.value}
                      onClick={() => handleWindowChange(w.value)}
                      className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors hover:bg-bg-surface ${
                        w.value === windowHours ? 'text-primary bg-primary/5' : 'text-text-secondary'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        <InfiniteFeed
          events={events}
          hasMore={hasMore}
          loading={loading}
          onLoadMore={() => !loading && hasMore && cursor && fetchPage(cursor)}
          onRefresh={() => reset(windowHours)}
          renderItem={(event) => <FeedEventCard key={String(event._id)} event={event} />}
          emptyTitle="No trending content yet"
          emptySubtitle="As researchers publish and engage, trending content will appear here."
        />
      </div>
    </div>
  );
};

export default TrendingFeed;
