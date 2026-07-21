import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Building2, Clock, MapPin, ExternalLink, Bookmark, GraduationCap } from 'lucide-react';

const JOB_TYPE_STYLES = {
  'PhD':        { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  'Postdoc':    { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20' },
  'Faculty':    { bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/20' },
  'Research':   { bg: 'bg-emerald-500/10',text: 'text-emerald-400',border: 'border-emerald-500/20' },
  'Industry':   { bg: 'bg-rose-500/10',   text: 'text-rose-400',   border: 'border-rose-500/20' },
};

const JobFeedCard = ({ event }) => {
  const meta = event.metadata || {};
  const deadline = meta.deadline ? new Date(meta.deadline) : null;
  // eslint-disable-next-line react-hooks/purity
  const daysLeft = deadline ? Math.ceil((deadline - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  // Detect job type from tags or title
  const jobType = meta.tags?.[0] || (
    meta.title?.toLowerCase().includes('phd') ? 'PhD' :
    meta.title?.toLowerCase().includes('postdoc') ? 'Postdoc' :
    meta.title?.toLowerCase().includes('faculty') ? 'Faculty' : 'Research'
  );
  const typeStyle = JOB_TYPE_STYLES[jobType] || JOB_TYPE_STYLES['Research'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-card border border-border-default rounded-2xl p-5 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
          <GraduationCap size={12} />{jobType} Position
        </div>
        {daysLeft !== null && daysLeft >= 0 && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            daysLeft <= 7
              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
              : 'bg-bg-surface text-text-muted border border-border-default'
          }`}>
            {daysLeft}d left
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-text-primary mb-2 line-clamp-2 leading-snug">
        {meta.title || 'Academic Job Opening'}
      </h3>

      {/* Institution & Location */}
      <div className="space-y-1 mb-3">
        {meta.institution && (
          <p className="flex items-center gap-1.5 text-xs text-primary/80 font-medium">
            <Building2 size={12} />{meta.institution}
          </p>
        )}
        {meta.location && (
          <p className="flex items-center gap-1.5 text-xs text-text-muted">
            <MapPin size={12} />{meta.location}
          </p>
        )}
      </div>

      {/* Description */}
      {meta.abstract && (
        <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed mb-3">{meta.abstract}</p>
      )}

      {/* Research Areas */}
      {meta.keywords?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {meta.keywords.slice(0, 3).map((kw, i) => (
            <span key={i} className={`text-xs px-2 py-0.5 rounded-full border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>{kw}</span>
          ))}
        </div>
      )}

      {/* Deadline */}
      {deadline && (
        <p className="flex items-center gap-1.5 text-xs text-text-muted mb-4">
          <Clock size={12} />Apply by: {deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-border-default">
        {meta.applyUrl ? (
          <a
            href={meta.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors text-white ${
              jobType === 'PhD' ? 'bg-purple-500 hover:bg-purple-600' :
              jobType === 'Postdoc' ? 'bg-blue-500 hover:bg-blue-600' :
              'bg-primary hover:bg-primary/90'
            }`}
          >
            <ExternalLink size={13} />Apply Now
          </a>
        ) : (
          <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors">
            <Briefcase size={13} />View Details
          </button>
        )}
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-text-muted border border-border-default hover:bg-bg-surface transition-colors">
          <Bookmark size={13} />Save Job
        </button>
      </div>
    </motion.div>
  );
};

export default JobFeedCard;
