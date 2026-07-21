import React from 'react';
import { motion } from 'framer-motion';
import { Pin, Megaphone, User, Building2, ExternalLink } from 'lucide-react';
import Avatar from '../../../components/ui/Avatar';

const AnnouncementFeedCard = ({ event }) => {
  const meta = event.metadata || {};
  const actor = event.actor || {};
  const isPinned = false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-card border border-border-default rounded-2xl p-5 hover:border-rose-500/30 hover:shadow-lg hover:shadow-rose-500/5 transition-all duration-300 relative overflow-hidden"
    >
      {/* Accent line */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-500 to-orange-500 rounded-l-2xl" />

      <div className="pl-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 bg-rose-500/10 text-rose-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-rose-500/20">
            <Megaphone size={12} />Announcement
          </div>
          {isPinned && (
            <span className="flex items-center gap-1 text-xs text-text-muted bg-bg-surface border border-border-default px-2 py-1 rounded-full">
              <Pin size={10} />Pinned
            </span>
          )}
        </div>

        {/* Actor */}
        <div className="flex items-center gap-2 mb-3">
          <Avatar
            src={actor.profileImage}
            name={`${actor.firstName} ${actor.lastName}`}
            size="sm"
            showBorder
          />
          <div>
            <span className="text-xs font-semibold text-text-primary">{actor.firstName} {actor.lastName}</span>
            {actor.institution && <span className="text-xs text-text-muted ml-1">· {actor.institution}</span>}
          </div>
        </div>

        {/* Content */}
        <h3 className="text-base font-bold text-text-primary mb-2 line-clamp-2 leading-snug">
          {meta.title || 'Announcement'}
        </h3>
        {meta.abstract && (
          <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed mb-3">{meta.abstract}</p>
        )}

        {/* Community/Collaboration source */}
        {meta.conference && (
          <p className="flex items-center gap-1.5 text-xs text-text-muted mb-4">
            <Building2 size={12} />From: {meta.conference}
          </p>
        )}

        {/* Date */}
        <p className="text-xs text-text-muted mb-3">
          {new Date(event.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        {/* CTA */}
        <div className="pt-3 border-t border-border-default">
          <button className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
            <ExternalLink size={13} />Read Full Announcement
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AnnouncementFeedCard;
