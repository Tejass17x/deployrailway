import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, FileText, ExternalLink, Clock, Bell } from 'lucide-react';

const ConferenceFeedCard = ({ event }) => {
  const meta = event.metadata || {};
  const deadline = meta.deadline ? new Date(meta.deadline) : null;
  // eslint-disable-next-line react-hooks/purity
  const daysLeft = deadline ? Math.ceil((deadline - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0;
  const isPast = daysLeft !== null && daysLeft < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-card border border-border-default rounded-2xl p-5 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300"
    >
      {/* Header Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 bg-amber-500/10 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-500/20">
          <Calendar size={12} />
          Conference
        </div>
        {daysLeft !== null && !isPast && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            isUrgent
              ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'
              : 'bg-bg-surface text-text-muted border border-border-default'
          }`}>
            {isUrgent ? `⚡ ${daysLeft}d left` : `${daysLeft}d left`}
          </span>
        )}
        {isPast && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-bg-surface text-text-muted border border-border-default">Closed</span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-text-primary mb-2 line-clamp-2 leading-snug">
        {meta.title || 'Conference'}
      </h3>

      {/* Details */}
      <div className="space-y-1.5 mb-4">
        {meta.location && (
          <p className="flex items-center gap-2 text-xs text-text-muted">
            <MapPin size={12} className="text-amber-400" />{meta.location}
          </p>
        )}
        {deadline && (
          <p className="flex items-center gap-2 text-xs text-text-muted">
            <Clock size={12} className="text-amber-400" />
            Deadline: {deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Tags */}
      {meta.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {meta.tags.slice(0, 3).map((t, i) => (
            <span key={i} className="text-xs bg-bg-surface text-text-muted border border-border-default px-2 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-border-default">
        {meta.applyUrl && (
          <a
            href={meta.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-semibold hover:bg-amber-600 transition-colors"
          >
            <FileText size={13} />Call for Papers
          </a>
        )}
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-text-muted border border-border-default hover:bg-bg-surface transition-colors">
          <Bell size={13} />Remind Me
        </button>
      </div>
    </motion.div>
  );
};

export default ConferenceFeedCard;
