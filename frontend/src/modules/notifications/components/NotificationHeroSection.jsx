import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BellRing, CheckCheck,
  RefreshCw, Loader2,
} from 'lucide-react';

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1];

// ── Individual action icon button ─────────────────────────────────────────────
const IconBtn = ({ icon: Icon, label, onClick, disabled, spinning, id }) => (
  <motion.button
    id={id}
    onClick={onClick}
    disabled={disabled}
    whileHover={{ scale: disabled ? 1 : 1.05, y: disabled ? 0 : -1 }}
    whileTap={{ scale: disabled ? 1 : 0.95 }}
    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    title={label}
    className="relative w-10 h-10 rounded-xl flex items-center justify-center border border-[#E2E8F0] bg-white text-[#475569] hover:text-[#2563EB] hover:border-[#BFDBFE] hover:bg-[#EFF6FF] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
  >
    <Icon className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
  </motion.button>
);

// ── Hero Section ──────────────────────────────────────────────────────────────
const NotificationHeroSection = ({
  stats,
  isMarkingAllRead,
  isFetching,
  onMarkAllRead,
  onRefresh,
}) => {
  const bellRef = useRef(null);

  // Periodic bell shake
  useEffect(() => {
    const interval = setInterval(() => {
      bellRef.current?.classList.add('animate-bell-shake');
      setTimeout(() => bellRef.current?.classList.remove('animate-bell-shake'), 700);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-6 mb-4 sm:mb-8">
      {/* Left: badge + heading + subtitle */}
      <div>
        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full mb-3 sm:mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(79,70,229,0.08))',
            border: '1px solid rgba(37,99,235,0.2)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
        >
          <BellRing
            ref={bellRef}
            className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#2563EB]"
          />
          <span className="text-[#2563EB] text-[10px] sm:text-xs font-bold tracking-wide uppercase">
            Notification Center
          </span>
          {stats.unread > 0 && (
            <motion.span
              key={stats.unread}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full text-[9px] sm:text-[10px] font-bold text-white flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563EB, #4F46E5)' }}
            >
              {stats.unread > 99 ? '99+' : stats.unread}
            </motion.span>
          )}
        </motion.div>

        {/* Heading */}
        <motion.h1
          className="text-2xl sm:text-4xl lg:text-5xl font-bold text-[#0F172A] mb-2 sm:mb-3 leading-tight font-display"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: EASE_OUT_EXPO }}
        >
          Notifications
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-xs sm:text-[15px] text-[#64748B] leading-relaxed max-w-xl"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15, ease: EASE_OUT_EXPO }}
        >
          Track mentions, citations, peer reviews, collaboration requests, project
          updates and research activity in one place.
        </motion.p>
      </div>

      {/* Right: action buttons */}
      <motion.div
        className="flex items-center gap-2 sm:gap-2.5 shrink-0"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, delay: 0.22, ease: EASE_OUT_EXPO }}
      >
        {/* Mark all as read — primary CTA */}
        <div
          className="p-[1.5px] rounded-lg sm:rounded-xl"
          style={{ background: 'linear-gradient(135deg, #2563EB, #4F46E5)' }}
        >
          <motion.button
            id="notif-mark-all-read"
            onClick={onMarkAllRead}
            disabled={stats.unread === 0 || isMarkingAllRead}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2.5 bg-white rounded-md sm:rounded-[10px] text-[#2563EB] font-semibold text-xs sm:text-sm transition-all duration-200 hover:bg-[#EFF6FF] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isMarkingAllRead ? (
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
            ) : (
              <CheckCheck className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
            Mark all as read
            {stats.unread > 0 && (
              <span
                className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: 'linear-gradient(135deg, #2563EB, #4F46E5)' }}
              >
                {stats.unread}
              </span>
            )}
          </motion.button>
        </div>


        {/* Refresh */}
        <IconBtn
          id="notif-refresh-btn"
          icon={RefreshCw}
          label="Refresh"
          onClick={onRefresh}
          disabled={isFetching}
          spinning={isFetching}
        />
      </motion.div>
    </div>
  );
};

export default NotificationHeroSection;
