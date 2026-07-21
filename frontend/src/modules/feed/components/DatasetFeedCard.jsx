import React from 'react';
import { motion } from 'framer-motion';
import { Database, User, Download, Bookmark, Share2, Tag, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Avatar from '../../../components/ui/Avatar';

const DatasetFeedCard = ({ event, onInteraction }) => {
  const meta = event.metadata || {};
  const actor = event.actor || {};

  const handleDownload = (e) => {
    e.stopPropagation();
    onInteraction?.(event._id, 'click');
    toast.success('Download starting...');
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(window.location.origin + '/datasets');
      onInteraction?.(event._id, 'share');
      toast.success('Link copied!');
    } catch { toast.error('Could not copy link.'); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-card border border-border-default rounded-2xl p-5 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
    >
      {/* Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-500/20">
          <Database size={12} />Dataset Shared
        </div>
        {meta.tags?.[0] && (
          <span className="text-xs font-medium bg-bg-surface text-text-muted border border-border-default px-2 py-1 rounded-full">
            {meta.tags[0]}
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
        <span className="text-xs text-text-muted">
          <span className="font-semibold text-text-primary">{actor.firstName} {actor.lastName}</span>
          {actor.institution && ` · ${actor.institution}`}
        </span>
      </div>

      {/* Content */}
      <h3 className="text-base font-bold text-text-primary mb-1 line-clamp-2 leading-snug">
        {meta.title || 'Research Dataset'}
      </h3>
      {meta.abstract && (
        <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed mb-3">{meta.abstract}</p>
      )}

      {/* Keywords */}
      {meta.keywords?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {meta.keywords.slice(0, 3).map((kw, i) => (
            <span key={i} className="flex items-center gap-1 text-xs bg-bg-surface text-text-muted border border-border-default px-2 py-0.5 rounded-full">
              <Tag size={9} />{kw}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-border-default">
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-semibold hover:bg-blue-600 transition-colors"
        >
          <Download size={13} />Download
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-text-muted border border-border-default hover:bg-bg-surface transition-colors"
        >
          <Share2 size={13} />Share
        </button>
        <button
          onClick={e => { e.stopPropagation(); onInteraction?.(event._id, 'bookmark'); toast.success('Saved'); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-text-muted border border-border-default hover:bg-bg-surface transition-colors"
        >
          <Bookmark size={13} />Save
        </button>
      </div>
    </motion.div>
  );
};

export default DatasetFeedCard;
