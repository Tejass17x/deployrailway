import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, Users, Clock, TrendingUp, MessageSquare,
  Network, Bookmark, Globe, Flame
} from 'lucide-react';
const TABS = [
  { id: 'for-you',     label: 'For You',     icon: Sparkles },
  { id: 'following',   label: 'Following',   icon: Users },
  { id: 'trending',    label: 'Trending',    icon: Flame },
  { id: 'latest',      label: 'Latest',      icon: Clock },
  { id: 'connections', label: 'Connections', icon: Network },
  { id: 'bookmarks',   label: 'Bookmarks',   icon: Bookmark },
];

const FeedFilters = ({ activeTab, onTabChange, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0 ${
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-surface'
              }`}
            >
              <Icon size={15} className={isActive ? 'text-primary' : ''} />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="feed-tab-indicator"
                  className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>
      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border-default" />
    </div>
  );
};

export { TABS };
export default FeedFilters;
