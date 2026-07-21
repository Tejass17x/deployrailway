import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw } from 'lucide-react';
import NotificationCard from './NotificationCard';
import NotificationEmptyState from './NotificationEmptyState';
import { NotificationCardSkeleton } from './NotificationSkeletons';
import BentoCards from './BentoCards';

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1];

// ── Section divider ───────────────────────────────────────────────────────────
const SectionLabel = ({ label, count }) => (
  <motion.div
    className="flex items-center gap-3 mb-4"
    initial={{ opacity: 0, letterSpacing: '0.3em' }}
    animate={{ opacity: 1, letterSpacing: '0.1em' }}
    transition={{ duration: 0.45, ease: 'easeOut' }}
  >
    <span className="uppercase text-[10px] tracking-widest text-[#94A3B8] font-bold whitespace-nowrap">
      {label}
    </span>
    {count > 0 && (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
        className="bg-[#F1F5F9] text-[#94A3B8] text-[10px] font-bold px-2 py-0.5 rounded-full"
      >
        {count}
      </motion.span>
    )}
    <motion.div
      className="flex-1 h-px origin-left"
      style={{ background: 'linear-gradient(90deg, #2563EB40, #4F46E540, transparent)' }}
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{ duration: 0.55, delay: 0.15, ease: EASE_OUT_EXPO }}
    />
  </motion.div>
);

// ── Feed component ─────────────────────────────────────────────────────────────
const NotificationFeed = ({
  isLoading,
  isFetching,
  today,
  yesterday,
  older,
  activeFilter,
  onDismiss,
  onMarkRead,
  onRefetch,
  weeklyStats,
  setActiveFilter,
}) => {
  const totalFiltered = today.length + yesterday.length + older.length;

  return (
    <div className="space-y-6">
      {/* ── Loading skeletons ──────────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <NotificationCardSkeleton key={i} delay={i * 0.07} />
          ))}
        </div>
      )}

      {/* ── Live feed ─────────────────────────────────────────────────────── */}
      {!isLoading && (
        <>
          {/* TODAY */}
          {today.length > 0 && (
            <section>
              <SectionLabel label="Today" count={today.length} />
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {today.map((notif, i) => (
                    <NotificationCard
                      key={notif.id}
                      notification={notif}
                      index={i}
                      onDismiss={onDismiss}
                      onMarkRead={onMarkRead}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* YESTERDAY */}
          {yesterday.length > 0 && (
            <section>
              <SectionLabel label="Yesterday" count={yesterday.length} />
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {yesterday.map((notif, i) => (
                    <NotificationCard
                      key={notif.id}
                      notification={notif}
                      index={today.length + i}
                      onDismiss={onDismiss}
                      onMarkRead={onMarkRead}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* OLDER */}
          {older.length > 0 && (
            <section>
              <SectionLabel label="Older" count={older.length} />
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {older.map((notif, i) => (
                    <NotificationCard
                      key={notif.id}
                      notification={notif}
                      index={i}
                      onDismiss={onDismiss}
                      onMarkRead={onMarkRead}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* BentoCards footer */}
          {activeFilter === 'all' && totalFiltered > 0 && (
            <BentoCards weeklyStats={weeklyStats} />
          )}

          {/* Empty state */}
          <AnimatePresence>
            {totalFiltered === 0 && (
              <NotificationEmptyState
                activeFilter={activeFilter}
                onBrowseAll={() => setActiveFilter('all')}
              />
            )}
          </AnimatePresence>

          {/* Refresh / load more button */}
          {totalFiltered > 0 && (
            <motion.div
              className="py-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <motion.button
                onClick={onRefetch}
                disabled={isFetching}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-[#E2E8F0] rounded-full text-[#475569] font-medium text-sm shadow-sm transition-all duration-200 hover:border-[#2563EB] hover:text-[#2563EB] hover:shadow-md disabled:opacity-60"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              >
                {isFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 text-[#2563EB] animate-spin" />
                    <span className="text-[#94A3B8]">Refreshing…</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Refresh notifications
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default NotificationFeed;
