import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Layers,
  BookOpen,
  AtSign,
  FileText,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

// ── Category definitions (badges driven by live stats prop) ───────────────────
const CATEGORIES = [
  { id: 'all',       label: 'All Activities',  icon: Layers,       color: '#2563EB', statsKey: 'unread'    },
  { id: 'citations', label: 'Citations',        icon: BookOpen,     color: '#2563EB', statsKey: 'citations' },
  { id: 'mentions',  label: 'Mentions',         icon: AtSign,       color: '#4F46E5', statsKey: 'mentions'  },
  { id: 'reviews',   label: 'Peer Reviews',     icon: FileText,     color: '#F59E0B', statsKey: 'reviews'   },
  { id: 'system',    label: 'System Updates',   icon: RefreshCw,    color: '#475569', statsKey: 'system'    },
];

const LAYOUT_SPRING = { type: 'spring', stiffness: 320, damping: 26 };

// ── Component ─────────────────────────────────────────────────────────────────
const CategoryPanel = ({ activeFilter, setActiveFilter, stats = {} }) => {
  const [settingsHovered, setSettingsHovered] = useState(false);
  const readRatio = stats.readRatio ?? 0;

  return (
    <div className="sticky top-6 bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">

      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <span className="uppercase text-[10px] tracking-widest text-[#94A3B8] font-bold">
          Categories
        </span>
        <button
          onMouseEnter={() => setSettingsHovered(true)}
          onMouseLeave={() => setSettingsHovered(false)}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#F1F5F9] transition-colors duration-200"
        >
          <motion.div
            animate={{ rotate: settingsHovered ? 90 : 0 }}
            transition={LAYOUT_SPRING}
          >
            <Settings className="w-4 h-4 text-[#94A3B8]" />
          </motion.div>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="space-y-1 mb-6">
        {CATEGORIES.map((cat, idx) => {
          const isActive = activeFilter === cat.id;
          const Icon     = cat.icon;
          const badge    = stats[cat.statsKey] ?? 0;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl relative overflow-hidden"
            >
              {/* Animated active background — layoutId morphs between tabs */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    key="active-bg"
                    layoutId="active-tab-background"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(79,70,229,0.05))',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={LAYOUT_SPRING}
                  />
                )}
              </AnimatePresence>

              {/* Active left accent line — also layout-animated */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    key="active-line"
                    layoutId="active-tab-indicator"
                    className="absolute left-0 top-1 bottom-1 rounded-full"
                    style={{ background: cat.color, width: '3px' }}
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    exit={{ scaleY: 0, opacity: 0 }}
                    transition={LAYOUT_SPRING}
                  />
                )}
              </AnimatePresence>

              {/* Icon + Label */}
              <div className="flex items-center gap-3 relative z-10">
                <motion.div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  animate={{
                    background: isActive ? `${cat.color}18` : 'transparent',
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon
                    className="w-4 h-4 transition-colors duration-200"
                    style={{ color: isActive ? cat.color : '#94A3B8' }}
                  />
                </motion.div>
                <motion.span
                  className="text-sm transition-colors duration-200"
                  animate={{
                    color:      isActive ? cat.color : '#475569',
                    fontWeight: isActive ? 700 : 500,
                  }}
                  transition={{ duration: 0.15 }}
                >
                  {cat.label}
                </motion.span>
              </div>

              {/* Badge */}
              {badge > 0 && (
                <motion.div
                  layout
                  className="relative z-10 flex items-center justify-center h-[22px] min-w-[22px] px-1.5 rounded-full text-[11px] font-bold"
                  animate={{
                    background: isActive
                      ? `linear-gradient(135deg, ${cat.color}, ${cat.id === 'all' ? '#4F46E5' : cat.color})`
                      : '#F1F5F9',
                    color: isActive ? '#FFFFFF' : '#94A3B8',
                    scale: isActive ? 1 : 0.95,
                  }}
                  transition={LAYOUT_SPRING}
                >
                  {badge}
                </motion.div>
              )}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-[#F1F5F9] mb-5" id="stats-trigger" />

      {/* Quick Stats heading */}
      <span className="uppercase text-[10px] tracking-widest text-[#94A3B8] font-bold block mb-4">
        Quick Stats
      </span>

      {/* Read Ratio */}
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm text-[#475569] font-medium">Read Ratio</span>
        <div className="flex items-baseline gap-0.5">
          <motion.span
            key={readRatio}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-xl text-[#22C55E] font-black leading-none"
          >
            {readRatio}
          </motion.span>
          <span className="text-sm text-[#22C55E] font-bold">%</span>
        </div>
      </div>

      {/* Animated progress bar */}
      <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-visible relative mb-1">
        <motion.div
          className="h-full rounded-full relative"
          style={{ background: 'linear-gradient(90deg, #22C55E, #10B981)' }}
          initial={{ width: '0%' }}
          animate={{ width: `${readRatio}%` }}
          transition={{ duration: 1.4, delay: 0.3, ease: [0.34, 1.1, 0.64, 1] }}
        >
          {readRatio > 0 && (
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white animate-glow-pulse"
              style={{ background: '#10B981', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }}
            />
          )}
        </motion.div>
      </div>
      <div className="flex justify-between text-[10px] text-[#CBD5E1] mt-1.5 mb-5">
        <span>0%</span>
        <span>100%</span>
      </div>

      {/* Mini stats rows */}
      <div className="space-y-2.5 pt-1">
        {[
          {
            label: 'This Week',
            value: stats.weeklyCitations != null ? `+${stats.weeklyCitations} citations` : '—',
            color: '#2563EB',
            delay: 0.1,
          },
          {
            label: 'Monthly',
            value: stats.total != null ? `${stats.total} reads` : '—',
            color: '#22C55E',
            delay: 0.2,
          },
        ].map(({ label, value, color, delay }) => (
          <motion.div
            key={label}
            className="flex justify-between items-center"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
              <span className="text-xs text-[#475569] font-medium">{label}</span>
            </div>
            <span className="text-xs font-bold" style={{ color }}>{value}</span>
          </motion.div>
        ))}
      </div>

      {/* Trending badge */}
      {stats.total > 0 && (
        <motion.div
          className="mt-5 p-3 bg-[#F8FAFC] rounded-xl border border-[#F1F5F9]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#DBEAFE] flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-[#2563EB]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#0F172A]">
                {stats.readRatio > 70 ? 'High engagement!' : 'Keep reading'}
              </p>
              <p className="text-[10px] text-[#94A3B8]">
                {stats.readRatio}% read ratio
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CategoryPanel;
