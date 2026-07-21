import React, { useState, useCallback } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import InfiniteFeed from '../components/InfiniteFeed';
import FeedEventCard from '../components/FeedEventCard';
import feedService from '../../../services/feed.service';

const LatestFeed = () => {
  const [events, setEvents] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchPage = useCallback(async (nextCursor) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await feedService.getActivityFeedLatest({ cursor: nextCursor, limit: 20 });
      if (res?.success) {
        const { events: newEvts = [], nextCursor: nc } = res.data || {};
        setEvents(prev => nextCursor ? [...prev, ...newEvts] : newEvts);
        setCursor(nc || null);
        setHasMore(!!nc);
      } else setHasMore(false);
    } catch { setHasMore(false); }
    finally { setLoading(false); }
  }, [loading]);

  React.useEffect(() => { fetchPage(null); }, []); // eslint-disable-line

  const refresh = useCallback(() => {
    setEvents([]); setCursor(null); setHasMore(true);
    fetchPage(null);
  }, [fetchPage]);

  return (
    <div className="min-h-screen bg-bg-page text-text-primary">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-bg-card border border-border-default rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Clock size={20} className="text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary">Latest Research</h1>
                <p className="text-xs text-text-muted">Most recent activity from researchers</p>
              </div>
            </div>
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-text-muted border border-border-default hover:bg-bg-surface hover:text-primary transition-all"
            >
              <RefreshCw size={13} />Refresh
            </button>
          </div>
        </div>

        <InfiniteFeed
          events={events}
          hasMore={hasMore}
          loading={loading}
          onLoadMore={() => !loading && hasMore && cursor && fetchPage(cursor)}
          onRefresh={refresh}
          renderItem={(event) => <FeedEventCard key={String(event._id)} event={event} />}
          emptyTitle="No activity yet"
          emptySubtitle="Be the first to publish research, share a dataset, or start a project."
        />
      </div>
    </div>
  );
};

export default LatestFeed;
