import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, AtSign, FileText, RefreshCw,
  Clock, Trash2, CheckCheck, ExternalLink,
  MessageCircle, UserCheck, Star,
  CheckCircle2, AlertCircle, Info,
  UserPlus, MessageSquare, Users, FolderOpen,
} from 'lucide-react';

// ── Type visual map ───────────────────────────────────────────────────────────
const TYPE_STYLES = {
  citation: {
    gradient: 'linear-gradient(135deg, #DBEAFE 0%, #EDE9FE 100%)',
    icon: BookOpen,
    iconColor: '#2563EB',
    borderColor: '#3B82F6',
    glowColor: 'rgba(37,99,235,0.15)',
    badgeText: 'Citation',
    badgeBg: '#EFF6FF',
    badgeColor: '#2563EB',
  },
  mention: {
    gradient: 'linear-gradient(135deg, #EDE9FE 0%, #F5F3FF 100%)',
    icon: AtSign,
    iconColor: '#4F46E5',
    borderColor: '#6366F1',
    glowColor: 'rgba(79,70,229,0.15)',
    badgeText: 'Mention',
    badgeBg: '#F5F3FF',
    badgeColor: '#4F46E5',
  },
  review: {
    gradient: 'linear-gradient(135deg, #FEF3C7 0%, #FEF9C3 100%)',
    icon: FileText,
    iconColor: '#D97706',
    borderColor: '#F59E0B',
    glowColor: 'rgba(245,158,11,0.15)',
    badgeText: 'Peer Review',
    badgeBg: '#FFFBEB',
    badgeColor: '#D97706',
  },
  system: {
    gradient: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
    icon: RefreshCw,
    iconColor: '#475569',
    borderColor: '#94A3B8',
    glowColor: 'rgba(71,85,105,0.10)',
    badgeText: 'System',
    badgeBg: '#F8FAFC',
    badgeColor: '#64748B',
  },
  follow: {
    gradient: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)',
    icon: UserPlus,
    iconColor: '#DB2777',
    borderColor: '#EC4899',
    glowColor: 'rgba(219,39,119,0.15)',
    badgeText: 'New Follower',
    badgeBg: '#FDF2F8',
    badgeColor: '#DB2777',
  },
  message: {
    gradient: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)',
    icon: MessageSquare,
    iconColor: '#7C3AED',
    borderColor: '#8B5CF6',
    glowColor: 'rgba(124,58,237,0.15)',
    badgeText: 'Message',
    badgeBg: '#FAF5FF',
    badgeColor: '#7C3AED',
  },
  collab: {
    gradient: 'linear-gradient(135deg, #CFFAFE 0%, #A5F3FC 100%)',
    icon: Users,
    iconColor: '#0891B2',
    borderColor: '#06B6D4',
    glowColor: 'rgba(8,145,178,0.15)',
    badgeText: 'Collaboration',
    badgeBg: '#ECFEFF',
    badgeColor: '#0891B2',
  },
  project: {
    gradient: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
    icon: FolderOpen,
    iconColor: '#0284C7',
    borderColor: '#0EA5E9',
    glowColor: 'rgba(2,132,199,0.15)',
    badgeText: 'Project',
    badgeBg: '#F0F9FF',
    badgeColor: '#0284C7',
  },
};

// ── Priority badge ─────────────────────────────────────────────────────────────
const PRIORITY_STYLES = {
  high: { bg: '#FEF2F2', color: '#DC2626', icon: AlertCircle, label: 'High' },
  medium: { bg: '#FFFBEB', color: '#D97706', icon: Info, label: 'Med' },
  low: { bg: '#F0FDF4', color: '#16A34A', icon: CheckCircle2, label: 'Low' },
};

const PriorityBadge = ({ priority }) => {
  const p = PRIORITY_STYLES[priority?.toLowerCase()] || PRIORITY_STYLES.low;
  const PIcon = p.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: p.bg, color: p.color }}
    >
      <PIcon className="w-2.5 h-2.5" />
      {p.label}
    </span>
  );
};

// ── Highlight text renderer ───────────────────────────────────────────────────
const renderDescription = (text = '', highlights = []) => {
  if (!highlights || highlights.length === 0) return text;
  let parts = [text];
  highlights.forEach((hl) => {
    const newParts = [];
    parts.forEach((part) => {
      if (typeof part !== 'string') { newParts.push(part); return; }
      const chunks = part.split(hl);
      chunks.forEach((s, i) => {
        newParts.push(s);
        if (i < chunks.length - 1) {
          newParts.push(
            <span
              key={`${hl}-${i}`}
              className="inline-block px-1.5 py-0.5 rounded-md bg-[#DBEAFE] text-[#2563EB] font-semibold mx-0.5 text-[12px]"
            >
              {hl}
            </span>
          );
        }
      });
    });
    parts = newParts;
  });
  return parts;
};

// ── Spring configs ─────────────────────────────────────────────────────────────
const HOVER_SPRING = { type: 'spring', stiffness: 400, damping: 22 };
const LAYOUT_SPRING = { type: 'spring', stiffness: 300, damping: 25 };

// ── Main NotificationCard ─────────────────────────────────────────────────────
const NotificationCard = ({ notification, index = 0, onDismiss, onMarkRead }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const navigate = useNavigate();

  const style = TYPE_STYLES[notification.type] || TYPE_STYLES.system;
  const Icon = style.icon;

  // ── Navigate on primary click ──────────────────────────────────────────────
  const handlePrimaryClick = (e) => {
    e.stopPropagation();
    if (!notification.isRead && onMarkRead) {
      onMarkRead(notification.id || notification._id);
    }
    let link = notification.targetUrl || notification.link;
    if (!link) {
      if (notification.targetType === 'User' || notification.originalType?.includes('connection') || notification.originalType === 'follow') {
        const actor = notification.actorId;
        const slug = actor?.profileSlug || actor?.username || actor?._id || actor;
        if (slug) link = `/profile/${slug}`;
      } else if (notification.targetType === 'Publication') {
        link = `/publications/${notification.targetId}`;
      } else if (notification.targetType === 'Dataset') {
        link = `/datasets/${notification.targetId}`;
      } else if (notification.targetType === 'Project') {
        link = `/projects/${notification.targetId}`;
      }
    }
    if (link && link !== '#') navigate(link);
  };

  const handleMarkRead = (e) => {
    e.stopPropagation();
    if (onMarkRead) onMarkRead(notification.id || notification._id);
  };

  const handleDismiss = () => {
    if (onDismiss) onDismiss(notification.id || notification._id);
  };

  // ── Avatar initials from actor ─────────────────────────────────────────────
  const actorName = notification.actorId
    ? `${notification.actorId.firstName || ''} ${notification.actorId.lastName || ''}`.trim()
    : '';
  const initials = actorName
    ? actorName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : notification.type[0].toUpperCase();

  const rawImage = notification.actorId?.avatar || notification.actorId?.profileImage;
  const avatarUrl = typeof rawImage === 'string' ? rawImage : rawImage?.url || null;

  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{
        opacity: 1, y: 0, scale: 1,
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: index * 0.06 },
      }}
      exit={{
        opacity: 0, x: 60, height: 0,
        marginBottom: 0, paddingTop: 0, paddingBottom: 0,
        transition: { duration: 0.28, ease: [0.4, 0, 0.6, 1] },
      }}
      transition={{ layout: LAYOUT_SPRING }}
      whileHover={{ scale: 1.012, y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handlePrimaryClick}
      className={`relative w-full bg-white rounded-[20px] border overflow-hidden cursor-pointer ${notification.isRead ? 'border-[#E2E8F0]' : 'border-[#BFDBFE]'
        }`}
      style={{
        boxShadow: isHovered
          ? `0 12px 36px ${style.glowColor}, 0 2px 8px rgba(0,0,0,0.04)`
          : '0 2px 8px rgba(15,23,42,0.04)',
        transition: 'box-shadow 220ms ease',
      }}
    >
      {/* Unread left accent */}
      {!notification.isRead && (
        <motion.div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[20px]"
          style={{
            background: `linear-gradient(180deg, ${style.borderColor}, ${style.borderColor}60)`,
          }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      )}

      {/* Hover gradient overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-[20px]"
        animate={{ opacity: isHovered ? 0.04 : 0 }}
        transition={{ duration: 0.2 }}
        style={{ background: style.gradient }}
      />

      <div className="p-3 sm:p-5 flex gap-2.5 sm:gap-4 relative">
        {/* Unread sonar dot */}
        {!notification.isRead && (
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10">
            <div className="relative w-1.5 h-1.5 sm:w-2.5 sm:h-2.5">
              <div className="absolute inset-0 bg-[#2563EB] rounded-full z-10 animate-pulse" />
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-60"
                style={{ background: '#2563EB' }}
              />
            </div>
          </div>
        )}

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <motion.div
            className="w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-[10px] sm:text-sm font-bold overflow-hidden"
            style={{
              background: (avatarUrl && !imgError) ? 'transparent' : style.gradient,
              border: `2px solid ${style.borderColor}40`,
              boxShadow: isHovered ? `0 4px 12px ${style.glowColor}` : 'none',
              transition: 'box-shadow 220ms ease',
            }}
            animate={{ scale: isHovered ? 1.08 : 1 }}
            transition={HOVER_SPRING}
          >
            {avatarUrl && !imgError ? (
              <img
                src={avatarUrl}
                alt={actorName}
                className="w-full h-full object-cover rounded-full"
                onError={() => setImgError(true)}
              />
            ) : (
              <span style={{ color: style.iconColor }}>{initials}</span>
            )}
          </motion.div>

          {/* Type icon badge */}
          <div
            className="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-[1.5px] sm:border-2 border-white"
            style={{ background: style.gradient }}
          >
            <Icon className="w-2 h-2 sm:w-2.5 sm:h-2.5" style={{ color: style.iconColor }} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-2 sm:pr-6">
          {/* Top row: title + badges + time */}
          <div className="flex flex-wrap items-start gap-x-1.5 gap-y-1 mb-0.5 sm:mb-1.5">
            <h4
              className="text-[11px] sm:text-[14px] font-bold leading-snug transition-colors duration-200 truncate"
              style={{ color: isHovered ? style.iconColor : '#0F172A' }}
            >
              {notification.title}
            </h4>

            {/* Type badge */}
            <span
              className="inline-block px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold flex-shrink-0"
              style={{ background: style.badgeBg, color: style.badgeColor }}
            >
              {style.badgeText}
            </span>

            {/* Priority badge */}
            {notification.priority && (
              <PriorityBadge priority={notification.priority} />
            )}

            {/* Time */}
            <div className="ml-auto flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[11px] text-[#94A3B8] flex-shrink-0">
              <motion.div
                animate={{ opacity: isHovered ? 1 : 0.5 }}
                transition={{ duration: 0.2 }}
              >
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </motion.div>
              <span>{notification.time}</span>
            </div>
          </div>

          {/* Actor name line */}
          {actorName && (
            <p className="text-[9px] sm:text-[12px] text-[#64748B] mb-1 sm:mb-1.5 font-medium">
              from <span className="text-[#2563EB]">{actorName}</span>
            </p>
          )}

          {/* Description */}
          <p className="text-[#64748B] text-[10px] sm:text-[13px] leading-[1.5] sm:leading-[1.65] mb-2 sm:mb-3 line-clamp-2">
            {renderDescription(notification.description, notification.highlights)}
          </p>

          {/* Action buttons row */}
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            {/* Primary CTA */}
            <motion.button
              onClick={handlePrimaryClick}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-md sm:rounded-lg text-[9px] sm:text-[12px] font-semibold text-white transition-all duration-200"
              style={{ background: `linear-gradient(135deg, ${style.iconColor}, ${style.borderColor})` }}
            >
              <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {notification.primaryAction || 'View'}
            </motion.button>

            {/* Reply button */}
            {(notification.type === 'mention' || notification.type === 'review' || notification.type === 'message') && (
              <motion.button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  const actor = notification.actorId;
                  const userId = actor?._id || actor;
                  if (userId) navigate(`/messages?user=${userId}`);
                  else navigate('/messages');
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-md sm:rounded-lg text-[9px] sm:text-[12px] font-semibold border border-[#E2E8F0] text-[#475569] bg-white hover:border-[#BFDBFE] hover:text-[#2563EB] transition-all duration-200"
              >
                <MessageCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Reply
              </motion.button>
            )}

            {/* Accept / Decline for collaboration */}
            {(notification.type === 'follow' || notification.type === 'collab') && (
              <>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Simulate accept then dismiss
                    setTimeout(() => { if (onDismiss) onDismiss(notification.id || notification._id); }, 300);
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-md sm:rounded-lg text-[9px] sm:text-[12px] font-semibold text-[#16A34A] border border-[#86EFAC] bg-[#F0FDF4] hover:bg-[#DCFCE7] transition-all duration-200"
                >
                  <UserCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  Accept
                </motion.button>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDismiss) onDismiss(notification.id || notification._id);
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-md sm:rounded-lg text-[9px] sm:text-[12px] font-semibold text-[#DC2626] border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] transition-all duration-200"
                >
                  Decline
                </motion.button>
              </>
            )}

            {/* Mark read */}
            {!notification.isRead && (
              <motion.button
                onClick={handleMarkRead}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.9 }}
                className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[12px] text-[#22C55E] hover:text-[#16A34A] font-semibold transition-colors duration-150"
              >
                <CheckCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Mark read</span>
              </motion.button>
            )}

            {/* Bookmark */}
            <motion.button
              onClick={() => setBookmarked((b) => !b)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="ml-auto"
            >
              <Star
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-200 ${bookmarked
                    ? 'fill-[#F59E0B] text-[#F59E0B]'
                    : 'text-[#CBD5E1] hover:text-[#F59E0B]'
                  }`}
              />
            </motion.button>

            {/* Dismiss */}
            <motion.button
              onClick={handleDismiss}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.9 }}
              className="inline-flex items-center gap-1 text-[10px] sm:text-[12px] text-[#CBD5E1] hover:text-[#EF4444] transition-colors duration-150 ml-1 sm:ml-2"
            >
              <Trash2 className="w-3 h-3" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationCard;
