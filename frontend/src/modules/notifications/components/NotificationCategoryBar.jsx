import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, AtSign, BookOpen, Users,
  FolderOpen, MessageSquare, UserPlus, FileCheck,
  RefreshCw,
} from 'lucide-react';

const LAYOUT_SPRING = { type: 'spring', stiffness: 320, damping: 26 };

// ── Category definitions ──────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all', label: 'All Activity', icon: Layers, color: '#2563EB', statsKey: 'unread' },
  { id: 'mentions', label: 'Mentions', icon: AtSign, color: '#4F46E5', statsKey: 'mentions' },
  { id: 'citations', label: 'Citations', icon: BookOpen, color: '#16A34A', statsKey: 'citations' },
  { id: 'reviews', label: 'Peer Reviews', icon: FileCheck, color: '#EA580C', statsKey: 'reviews' },
  { id: 'projects', label: 'Projects', icon: FolderOpen, color: '#0891B2', statsKey: 'projects' },
  { id: 'messages', label: 'Messages', icon: MessageSquare, color: '#7C3AED', statsKey: 'messages' },
  { id: 'follow', label: 'Followers', icon: UserPlus, color: '#DB2777', statsKey: 'follows' },
  { id: 'collab', label: 'Collaboration', icon: Users, color: '#0891B2', statsKey: 'collabs' },
  { id: 'system', label: 'System Updates', icon: RefreshCw, color: '#475569', statsKey: 'system' },
];

const CategoryRow = ({ cat, isActive, badge, onClick }) => {
  const Icon = cat.icon;
  return (
    <button
      key={cat.id}
      onClick={() => onClick(cat.id)}
      className="snap-start w-auto lg:w-full flex-shrink-0 flex items-center justify-between px-3 lg:px-3 py-2 lg:py-2.5 rounded-xl relative overflow-hidden group/row transition-colors duration-150"
    >
      {/* Active morphing background */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="active-bg"
            layoutId="catbar-active-bg"
            className="absolute inset-0 rounded-xl"
            style={{ background: `${cat.color}12` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={LAYOUT_SPRING}
          />
        )}
      </AnimatePresence>

      {/* Active left/bottom bar */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="active-line"
            layoutId="catbar-active-line"
            className="hidden lg:block absolute left-1/2 -bottom-0 lg:bottom-auto lg:left-0 lg:top-1.5 lg:bottom-1.5 w-1/2 lg:w-[3px] h-[3px] lg:h-auto -translate-x-1/2 lg:translate-x-0 rounded-t-full lg:rounded-t-none lg:rounded-r-full"
            style={{ background: cat.color }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={LAYOUT_SPRING}
          />
        )}
      </AnimatePresence>

      {/* Icon + label */}
      <div className="flex items-center gap-1.5 lg:gap-3 relative z-10">
        <motion.div
          className="w-5 h-5 lg:w-7 lg:h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          animate={{ background: isActive ? `${cat.color}18` : 'transparent' }}
          transition={{ duration: 0.2 }}
        >
          <Icon
            className="w-3 h-3 lg:w-4 lg:h-4 transition-colors duration-200"
            style={{ color: isActive ? cat.color : '#94A3B8' }}
          />
        </motion.div>
        <motion.span
          className="text-[10px] lg:text-sm transition-colors duration-200 whitespace-nowrap"
          animate={{
            color: isActive ? cat.color : '#475569',
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
          className="relative z-10 flex items-center justify-center h-[18px] min-w-[18px] lg:h-[20px] lg:min-w-[20px] px-1 lg:px-1.5 rounded-full text-[9px] lg:text-[10px] font-bold ml-1.5 lg:ml-0"
          animate={{
            background: isActive ? cat.color : '#F1F5F9',
            color: isActive ? '#FFFFFF' : '#94A3B8',
          }}
          transition={LAYOUT_SPRING}
        >
          {badge}
        </motion.div>
      )}
    </button>
  );
};

// ── Category bar ──────────────────────────────────────────────────────────────
const NotificationCategoryBar = ({ activeFilter, setActiveFilter, stats = {} }) => {

  return (
    <div
      className="lg:sticky lg:top-6 bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 4px 24px rgba(15,23,42,0.06)' }}
    >
      {/* Header */}
      <div className="hidden lg:flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#F1F5F9]">
        <span className="uppercase text-[10px] tracking-widest text-[#94A3B8] font-bold">
          Categories
        </span>
      </div>

      {/* Categories list */}
      <div className="flex flex-wrap lg:flex-nowrap lg:flex-col p-2 lg:p-3 gap-2 lg:gap-0 lg:space-y-0.5 border-b border-[#F1F5F9] lg:border-none">
        {CATEGORIES.map((cat) => {
          const badge = cat.statsKey ? (stats[cat.statsKey] ?? 0) : 0;
          return (
            <CategoryRow
              key={cat.id}
              cat={cat}
              isActive={activeFilter === cat.id}
              badge={badge}
              onClick={setActiveFilter}
            />
          );
        })}
      </div>

      {/* Footer — read ratio summary */}
      <div className="hidden lg:block px-5 pb-5 pt-3 border-t border-[#F1F5F9]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-[#475569] font-medium">Read Ratio</span>
          <motion.span
            key={stats.readRatio}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-black text-[#22C55E]"
          >
            {stats.readRatio ?? 0}%
          </motion.span>
        </div>
        <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #22C55E, #10B981)' }}
            initial={{ width: '0%' }}
            animate={{ width: `${stats.readRatio ?? 0}%` }}
            transition={{ duration: 1.4, delay: 0.4, ease: [0.34, 1.1, 0.64, 1] }}
          />
        </div>

        {/* Quick stats */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            { label: 'This Week', value: `+${stats.weeklyCitations ?? 0}`, color: '#2563EB' },
            { label: 'Monthly', value: `${stats.total ?? 0}`, color: '#22C55E' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl p-2.5"
              style={{ background: `${color}0A`, border: `1px solid ${color}20` }}
            >
              <p className="text-[10px] text-[#94A3B8] font-medium mb-0.5">{label}</p>
              <p className="text-sm font-black" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationCategoryBar;
