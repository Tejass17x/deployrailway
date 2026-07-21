import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, AtSign, FileText, RefreshCw,
  Clock, Trash2, CheckCheck,
} from 'lucide-react';

// ── Type → visual style map ───────────────────────────────────────────────────
const CATEGORY_STYLES = {
  citation: {
    gradient:    'linear-gradient(135deg, #DBEAFE 0%, #EDE9FE 100%)',
    icon:        BookOpen,
    iconColor:   '#2563EB',
    borderColor: '#2563EB',
    glowColor:   'rgba(37,99,235,0.15)',
  },
  mention: {
    gradient:    'linear-gradient(135deg, #EDE9FE 0%, #F5F3FF 100%)',
    icon:        AtSign,
    iconColor:   '#4F46E5',
    borderColor: '#4F46E5',
    glowColor:   'rgba(79,70,229,0.15)',
  },
  review: {
    gradient:    'linear-gradient(135deg, #FEF3C7 0%, #FEF9C3 100%)',
    icon:        FileText,
    iconColor:   '#F59E0B',
    borderColor: '#F59E0B',
    glowColor:   'rgba(245,158,11,0.15)',
  },
  system: {
    gradient:    'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
    icon:        RefreshCw,
    iconColor:   '#475569',
    borderColor: '#94A3B8',
    glowColor:   'rgba(71,85,105,0.10)',
  },
};

// ── Highlight pill renderer ───────────────────────────────────────────────────
const renderDescription = (text, highlights = []) => {
  if (!highlights || highlights.length === 0) return text;
  let parts = [text];
  highlights.forEach((highlight) => {
    const newParts = [];
    parts.forEach((part) => {
      if (typeof part !== 'string') { newParts.push(part); return; }
      const chunks = part.split(highlight);
      chunks.forEach((s, i) => {
        newParts.push(s);
        if (i < chunks.length - 1) {
          newParts.push(
            <span
              key={`${highlight}-${i}`}
              className="inline-block px-1.5 py-0.5 rounded-md bg-[#DBEAFE] text-[#2563EB] font-medium mx-0.5 text-[13px]"
            >
              {highlight}
            </span>
          );
        }
      });
    });
    parts = newParts;
  });
  return parts;
};

// ── Spring configs ────────────────────────────────────────────────────────────
const HOVER_SPRING = { type: 'spring', stiffness: 400, damping: 22 };
const LAYOUT_SPRING = { type: 'spring', stiffness: 300, damping: 25 };

// ── Component ─────────────────────────────────────────────────────────────────
const NotificationCardV2 = ({ notification, index = 0, onDismiss, onMarkRead }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const handlePrimaryClick = (e) => {
    e.stopPropagation();
    if (!notification.isRead && onMarkRead) {
      onMarkRead(notification.id || notification._id);
    }
    
    let link = notification.targetUrl || notification.link;
    if (!link) {
      if (notification.targetType === 'User' || notification.originalType?.includes('connection') || notification.originalType === 'follow') {
        const actor = notification.actorId;
        const profileSlug = actor?.profileSlug || actor?.username || actor?._id || actor;
        if (profileSlug) {
          link = `/profile/${profileSlug}`;
        }
      } else if (notification.targetType === 'Publication') {
        link = `/publications/${notification.targetId}`;
      } else if (notification.targetType === 'Dataset') {
        link = `/datasets/${notification.targetId}`;
      } else if (notification.targetType === 'Project') {
        link = `/projects/${notification.targetId}`;
      }
    }
    
    if (link && link !== '#') {
      navigate(link);
    }
  };

  const styleParams = CATEGORY_STYLES[notification.type] || CATEGORY_STYLES.system;
  const Icon        = styleParams.icon;

  const handleDismiss = () => {
    if (onDismiss) onDismiss(notification.id || notification._id);
  };

  const handleMarkRead = (e) => {
    e.stopPropagation();
    if (onMarkRead) onMarkRead(notification.id || notification._id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.45,
          ease: [0.22, 1, 0.36, 1],
          delay: index * 0.07,
        },
      }}
      exit={{
        opacity: 0,
        x: 60,
        height: 0,
        marginBottom: 0,
        paddingTop: 0,
        paddingBottom: 0,
        transition: { duration: 0.3, ease: [0.4, 0, 0.6, 1] },
      }}
      transition={{ layout: LAYOUT_SPRING }}
      whileHover={{ scale: 1.015, y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative w-full bg-white rounded-2xl border overflow-hidden
        ${notification.isRead ? 'border-[#E2E8F0]' : 'border-[#BFDBFE] notification-unread'}
      `}
      style={{
        boxShadow: isHovered
          ? `0 8px 28px ${styleParams.glowColor}, 0 2px 8px rgba(0,0,0,0.04)`
          : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'box-shadow 200ms ease',
        transformOrigin: 'center',
      }}
    >
      {/* Unread left accent bar */}
      {!notification.isRead && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
          style={{
            background: `linear-gradient(180deg, ${styleParams.borderColor}, ${styleParams.borderColor}80)`,
            transition: 'transform 200ms ease',
            transform: isHovered ? 'scaleX(1.6)' : 'scaleX(1)',
            transformOrigin: 'left',
          }}
        />
      )}

      {/* Gradient overlay on hover */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{ background: styleParams.gradient, opacity: 0.03 }}
        />
      )}

      <div className="p-5 flex gap-4 relative">
        {/* Unread sonar dot */}
        {!notification.isRead && (
          <div className="absolute top-4 right-4 unread-dot-container">
            <div className="relative w-2.5 h-2.5">
              <div className="absolute inset-0 bg-[#2563EB] rounded-full z-10 animate-pulse-dot" />
              <div className="absolute inset-0 bg-[#2563EB] rounded-full animate-pulse-ring-notif" />
            </div>
          </div>
        )}

        {/* Type icon */}
        <motion.div
          className="w-[52px] h-[52px] rounded-full flex-shrink-0 flex items-center justify-center"
          style={{ background: styleParams.gradient }}
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={HOVER_SPRING}
        >
          <Icon
            className="w-[22px] h-[22px]"
            style={{ color: styleParams.iconColor }}
          />
        </motion.div>

        {/* Content */}
        <div className="flex-1 pr-5 min-w-0">
          {/* Title + timestamp */}
          <div className="flex justify-between items-start mb-1.5 gap-2">
            <h4
              className="text-[15px] font-semibold leading-snug truncate transition-colors duration-200"
              style={{ color: isHovered ? styleParams.borderColor : '#0F172A' }}
            >
              {notification.title}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] shrink-0">
              <Clock
                className="w-3 h-3"
                style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 200ms' }}
              />
              <span>{notification.time}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-[#475569] text-[14px] leading-[1.65] mb-3">
            {renderDescription(notification.description, notification.highlights)}
          </p>

          {/* Actions row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Primary CTA */}
            <motion.button
              onClick={handlePrimaryClick}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className="text-[13px] font-semibold text-[#2563EB] relative group/primary"
            >
              {notification.primaryAction}
              <span className="absolute -bottom-0.5 left-0 right-0 h-[1.5px] bg-[#2563EB] scale-x-0 origin-left group-hover/primary:scale-x-100 transition-transform duration-200" />
            </motion.button>

            <span className="text-[#E2E8F0] select-none">|</span>

            {/* Secondary CTA */}
            {notification.secondaryAction && (
              <>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  className="text-[13px] text-[#94A3B8] hover:text-[#475569] transition-colors duration-150 relative group/sec"
                >
                  {notification.secondaryAction}
                  <span className="absolute -bottom-0.5 left-0 right-0 h-[1px] bg-[#94A3B8] scale-x-0 origin-left group-hover/sec:scale-x-100 transition-transform duration-200" />
                </motion.button>
                <span className="text-[#E2E8F0] select-none">|</span>
              </>
            )}

            {/* Mark as Read — only when unread */}
            {!notification.isRead && (
              <>
                <motion.button
                  onClick={handleMarkRead}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  className="text-[13px] text-[#22C55E] hover:text-[#16A34A] font-medium flex items-center gap-1 transition-colors duration-150"
                  title="Mark as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark read
                </motion.button>
                <span className="text-[#E2E8F0] select-none">|</span>
              </>
            )}

            {/* Dismiss */}
            <motion.button
              onClick={handleDismiss}
              whileHover={{ scale: 1.04, color: '#EF4444' }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className="text-[13px] text-[#94A3B8] flex items-center gap-1.5 transition-colors duration-150 group/dismiss"
            >
              Dismiss
              <Trash2
                className="w-3.5 h-3.5 transition-all duration-150"
                style={{
                  opacity:    isHovered ? 0.7 : 0,
                  transform:  isHovered ? 'translateY(0)' : 'translateY(-4px)',
                }}
              />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationCardV2;
