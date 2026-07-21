import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, SearchX, RefreshCw } from 'lucide-react';

/**
 * InfiniteFeed — Generic cursor-based infinite scroll container.
 * Handles IntersectionObserver, loading state, empty state,
 * and deduplication by _id.
 */
const InfiniteFeed = ({
  events = [],
  hasMore = false,
  loading = false,
  onLoadMore,
  renderItem,
  emptyTitle = 'Nothing here yet',
  emptySubtitle = 'Check back later for updates.',
  onRefresh
}) => {
  const sentinelRef = useRef(null);

  const handleIntersect = useCallback(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        onLoadMore?.();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersect, { threshold: 0.1, rootMargin: '200px' });
    const sentinel = sentinelRef.current;
    if (sentinel) observer.observe(sentinel);
    return () => { if (sentinel) observer.unobserve(sentinel); };
  }, [handleIntersect]);

  // Deduplicate by _id
  const seen = new Set();
  const dedupedEvents = events.filter((ev, idx) => {
    const id = String(ev._id || ev.id || idx);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Feed items */}
      <AnimatePresence initial={false}>
        {dedupedEvents.map((event, idx) => (
          <motion.div
            key={String(event._id || event.id || idx)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, delay: idx < 5 ? idx * 0.04 : 0 }}
          >
            {renderItem(event, idx)}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Initial loading skeleton */}
      {loading && dedupedEvents.length === 0 && (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-bg-card border border-border-default rounded-2xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-bg-surface" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-bg-surface rounded w-1/3" />
                  <div className="h-2.5 bg-bg-surface rounded w-1/4" />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-bg-surface rounded w-4/5" />
                <div className="h-3 bg-bg-surface rounded w-full" />
                <div className="h-3 bg-bg-surface rounded w-3/4" />
              </div>
              <div className="flex gap-2">
                <div className="h-7 w-16 bg-bg-surface rounded-lg" />
                <div className="h-7 w-16 bg-bg-surface rounded-lg" />
                <div className="h-7 w-16 bg-bg-surface rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load-more spinner */}
      {loading && dedupedEvents.length > 0 && (
        <div className="flex justify-center py-6">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Loader2 size={18} className="animate-spin text-primary" />
            Loading more...
          </div>
        </div>
      )}

      {/* Intersection sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {/* End of feed */}
      {!hasMore && !loading && dedupedEvents.length > 0 && (
        <div className="flex flex-col items-center gap-3 py-10 text-text-muted">
          <div className="w-12 h-12 rounded-full bg-bg-surface flex items-center justify-center">
            <SearchX size={20} />
          </div>
          <p className="text-sm font-medium">You're all caught up!</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <RefreshCw size={13} />Refresh feed
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && dedupedEvents.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-bg-surface flex items-center justify-center">
            <SearchX size={28} className="text-text-muted" />
          </div>
          <div>
            <p className="text-base font-semibold text-text-primary mb-1">{emptyTitle}</p>
            <p className="text-sm text-text-muted">{emptySubtitle}</p>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <RefreshCw size={14} />Refresh
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default InfiniteFeed;
