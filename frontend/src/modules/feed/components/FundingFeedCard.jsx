import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Clock, Building2, ExternalLink, Bookmark, CheckCircle } from 'lucide-react';

const FundingFeedCard = ({ event }) => {
  const meta = event.metadata || {};
  const deadline = meta.deadline ? new Date(meta.deadline) : null;
  // eslint-disable-next-line react-hooks/purity
  const daysLeft = deadline ? Math.ceil((deadline - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  const isUrgent = daysLeft !== null && daysLeft <= 14 && daysLeft >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-card border border-border-default rounded-2xl p-5 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-500/20">
          <DollarSign size={12} />
          Funding Opportunity
        </div>
        {meta.grantAmount && (
          <span className="text-sm font-bold text-emerald-400">{meta.grantAmount}</span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-text-primary mb-1 line-clamp-2 leading-snug">
        {meta.title || 'Research Grant'}
      </h3>

      {/* Funding Agency */}
      {meta.institution && (
        <p className="flex items-center gap-1.5 text-xs text-primary/80 font-medium mb-3">
          <Building2 size={12} />{meta.institution}
        </p>
      )}

      {/* Abstract */}
      {meta.abstract && (
        <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed mb-3">{meta.abstract}</p>
      )}

      {/* Deadline */}
      {deadline && (
        <div className={`flex items-center gap-2 text-xs mb-3 px-3 py-2 rounded-xl ${
          isUrgent ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-bg-surface text-text-muted border border-border-default'
        }`}>
          <Clock size={12} />
          Application Deadline: {deadline.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          {isUrgent && <span className="ml-auto font-bold">{daysLeft}d left</span>}
        </div>
      )}

      {/* Eligibility */}
      {meta.tags?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-text-muted mb-1.5">Eligible Areas</p>
          <div className="flex flex-wrap gap-1.5">
            {meta.tags.slice(0, 3).map((t, i) => (
              <span key={i} className="flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                <CheckCircle size={9} />{t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-border-default">
        {meta.applyUrl && (
          <a
            href={meta.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-semibold hover:bg-emerald-600 transition-colors"
          >
            <ExternalLink size={13} />Apply Now
          </a>
        )}
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-text-muted border border-border-default hover:bg-bg-surface transition-colors">
          <Bookmark size={13} />Save
        </button>
      </div>
    </motion.div>
  );
};

export default FundingFeedCard;
