import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Search, Inbox } from 'lucide-react';

const FILTER_MESSAGES = {
  all: {
    title: "You're all caught up!",
    subtitle: "No notifications here. Check back later — your research network is active.",
  },
  citations: {
    title: 'No citations yet',
    subtitle: 'When others reference your research, citations will appear here.',
  },
  mentions: {
    title: 'No mentions found',
    subtitle: 'When someone tags you or references your work, mentions appear here.',
  },
  reviews: {
    title: 'No peer reviews',
    subtitle: 'Peer review requests and feedback will surface here.',
  },
  system: {
    title: 'No system updates',
    subtitle: 'Platform updates and announcements will appear here.',
  },
};

const NotificationEmptyState = ({ activeFilter = 'all', onBrowseAll }) => {
  const msg = FILTER_MESSAGES[activeFilter] || FILTER_MESSAGES.all;

  const IconComponent = activeFilter === 'citations'
    ? Inbox
    : activeFilter === 'mentions'
    ? Search
    : Bell;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center py-24 px-8 text-center"
    >
      {/* Floating icon */}
      <motion.div
        className="relative mb-6"
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      >
        {/* Outer glow ring */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)',
            transform: 'scale(1.8)',
          }}
        />
        {/* Icon container */}
        <div
          className="relative w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #EFF6FF 0%, #EDE9FE 100%)',
            border: '1.5px solid rgba(37,99,235,0.15)',
            boxShadow: '0 8px 32px rgba(37,99,235,0.1)',
          }}
        >
          {/* Decorative dots */}
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#BFDBFE] opacity-60" />
          <div className="absolute bottom-3 left-3 w-1.5 h-1.5 rounded-full bg-[#C4B5FD] opacity-40" />
          <IconComponent className="w-10 h-10 text-[#94A3B8]" />
        </div>
      </motion.div>

      {/* Text */}
      <motion.h3
        className="text-[#0F172A] font-bold text-xl mb-2 font-display"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {msg.title}
      </motion.h3>

      <motion.p
        className="text-[#94A3B8] text-sm max-w-xs leading-relaxed mb-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {msg.subtitle}
      </motion.p>

      {/* CTA */}
      {activeFilter !== 'all' && onBrowseAll && (
        <motion.button
          onClick={onBrowseAll}
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #2563EB, #4F46E5)' }}
        >
          Browse All Notifications
        </motion.button>
      )}
    </motion.div>
  );
};

export default NotificationEmptyState;
