import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion';
import {
  Bell, BellDot, AtSign, BookOpen, Users,
  FolderOpen, FileCheck, TrendingUp, MessageCircle
} from 'lucide-react';
import { StatCardSkeleton } from './NotificationSkeletons';

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1];

// ── Animated counter ──────────────────────────────────────────────────────────
const AnimatedNumber = ({ value, suffix = '', className = '' }) => {
  const count   = useMotionValue(0);
  const rounded = useTransform(count, (v) => `${Math.round(v)}${suffix}`);
  const ref     = useRef(null);
  const inView  = useInView(ref, { once: true, margin: '-40px' });

  React.useEffect(() => {
    if (!inView) return;
    const ctrl = animate(count, value, { duration: 1.1, ease: 'easeOut' });
    return ctrl.stop;
  }, [inView, value, count]);

  return <motion.span ref={ref} className={className}>{rounded}</motion.span>;
};

// ── Trend arrow indicator ─────────────────────────────────────────────────────
const TrendIndicator = ({ positive = true }) => (
  <span
    className="inline-flex items-center gap-0.5 text-[8px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full"
    style={{
      background: positive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.1)',
      color:      positive ? '#16A34A' : '#DC2626',
    }}
  >
    {positive ? '▲' : '▼'} {positive ? 'Active' : 'Quiet'}
  </span>
);

// ── Single stat card ──────────────────────────────────────────────────────────
const StatCard = ({
  icon: Icon,
  label,
  value,
  subtitle,
  gradient,
  iconGradient,
  iconColor,
  delay = 0,
  isRatio = false,
  fillColor,
  onClick,
  isClickable = false,
  isActive = false,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: 'spring', stiffness: 280, damping: 24, delay }}
    whileHover={isClickable ? {
      scale: 1.025,
      y: -4,
      boxShadow: '0 16px 48px rgba(15,23,42,0.1)',
      transition: { type: 'spring', stiffness: 340, damping: 22 },
    } : {}}
    onClick={isClickable ? onClick : undefined}
    className={`relative rounded-2xl sm:rounded-[20px] border p-3.5 sm:p-5 overflow-hidden group min-w-0 transition-all duration-200 ${
      isClickable ? 'cursor-pointer hover:border-[#BFDBFE]' : 'cursor-default'
    } ${
      isActive ? 'ring-2 ring-offset-2 ring-[#2563EB] border-transparent shadow-md' : 'border-[#E2E8F0]'
    }`}
    style={{
      background: gradient,
      boxShadow: isActive ? '0 8px 24px rgba(37,99,235,0.15)' : '0 2px 8px rgba(15,23,42,0.04)',
    }}
  >
    {/* Decorative blob */}
    <div
      className="absolute -top-5 -right-5 w-16 h-16 sm:w-20 sm:h-20 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300"
      style={{ background: iconColor }}
    />

    <div className="relative min-w-0">
      {/* Icon + trend */}
      <div className="flex items-start justify-between mb-2.5 sm:mb-3">
        <div
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconGradient, boxShadow: `0 4px 12px ${iconColor}30` }}
        >
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: iconColor }} />
        </div>
        <TrendIndicator positive={value > 0} />
      </div>

      {/* Label */}
      <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-0.5 sm:mb-1 truncate">
        {label}
      </p>

      {/* Value */}
      <div className="flex items-baseline gap-1 mb-1 min-w-0">
        <AnimatedNumber
          value={value}
          suffix={isRatio ? '%' : ''}
          className="text-2xl sm:text-[32px] font-black text-[#0F172A] leading-none truncate"
        />
      </div>

      {/* Progress bar (for ratio) */}
      {isRatio && (
        <div className="mt-2 sm:mt-3 w-full h-1 sm:h-1.5 bg-white/60 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: fillColor }}
            initial={{ width: '0%' }}
            animate={{ width: `${value}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: delay + 0.2 }}
          />
        </div>
      )}

      {/* Subtitle */}
      {subtitle && !isRatio && (
        <p className="text-[10px] sm:text-[12px] text-[#475569] mt-0.5 font-medium truncate">{subtitle}</p>
      )}
    </div>
  </motion.div>
);

// ── Stats grid ────────────────────────────────────────────────────────────────
const NotificationStatsGrid = ({ stats = {}, isLoading = false, onCardClick, activeFilter }) => {
  const cards = [
    {
      icon:         Bell,
      label:        'Total Notifications',
      value:        stats.total ?? 0,
      subtitle:     'all time',
      gradient:     'linear-gradient(135deg, #EFF6FF 0%, #F0F4FF 100%)',
      iconGradient: 'rgba(219,234,254,0.8)',
      iconColor:    '#2563EB',
      fillColor:    '#2563EB',
      filterType:   'all',
    },
    {
      icon:         MessageCircle,
      label:        'Messages',
      value:        stats.messages ?? 0,
      subtitle:     'direct messages',
      gradient:     'linear-gradient(135deg, #FFFBEB 0%, #FEF9C3 100%)',
      iconGradient: 'rgba(254,243,199,0.9)',
      iconColor:    '#D97706',
      fillColor:    '#F59E0B',
      filterType:   'messages',
    },
    {
      icon:         AtSign,
      label:        'Mentions',
      value:        stats.mentions ?? 0,
      subtitle:     'referenced your work',
      gradient:     'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
      iconGradient: 'rgba(237,233,254,0.9)',
      iconColor:    '#4F46E5',
      fillColor:    '#4F46E5',
      filterType:   'mentions',
    },
    {
      icon:         BookOpen,
      label:        'Citations',
      value:        stats.citations ?? 0,
      subtitle:     'research references',
      gradient:     'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
      iconGradient: 'rgba(220,252,231,0.9)',
      iconColor:    '#16A34A',
      fillColor:    '#22C55E',
      filterType:   'citations',
    },
    {
      icon:         Users,
      label:        'Collaboration Requests',
      value:        stats.system ?? 0,
      subtitle:     'awaiting response',
      gradient:     'linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 100%)',
      iconGradient: 'rgba(207,250,254,0.9)',
      iconColor:    '#0891B2',
      fillColor:    '#06B6D4',
      filterType:   'collab',
    },
    {
      icon:         FolderOpen,
      label:        'Project Updates',
      value:        0,
      subtitle:     'project activity',
      gradient:     'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
      iconGradient: 'rgba(224,242,254,0.9)',
      iconColor:    '#0284C7',
      fillColor:    '#0EA5E9',
      filterType:   'projects',
    },
    {
      icon:         FileCheck,
      label:        'Peer Reviews',
      value:        stats.reviews ?? 0,
      subtitle:     'pending feedback',
      gradient:     'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
      iconGradient: 'rgba(255,237,213,0.9)',
      iconColor:    '#EA580C',
      fillColor:    '#F97316',
      filterType:   'reviews',
    },
    {
      icon:         TrendingUp,
      label:        'Read Ratio',
      value:        stats.readRatio ?? 0,
      subtitle:     null,
      gradient:     'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
      iconGradient: 'rgba(209,250,229,0.9)',
      iconColor:    '#059669',
      fillColor:    'linear-gradient(90deg, #22C55E, #10B981)',
      isRatio:      true,
      filterType:   null,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-10">
      {isLoading
        ? Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)
        : cards.map((card, i) => (
            <StatCard 
              key={card.label} 
              {...card} 
              delay={i * 0.04} 
              isClickable={!!card.filterType}
              isActive={card.filterType && activeFilter === card.filterType}
              onClick={() => {
                if (card.filterType && onCardClick) {
                  onCardClick(card.filterType);
                  // Scroll down to the feed smoothly
                  setTimeout(() => {
                    const feed = document.getElementById('notification-feed-start');
                    if (feed) {
                      feed.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 50);
                }
              }}
            />
          ))
      }
    </div>
  );
};

export default NotificationStatsGrid;
