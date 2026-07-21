import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Building2, Users, BookOpen, UserPlus, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Avatar from '../../../components/ui/Avatar';
import feedService from '../../../services/feed.service';

const ResearcherFeedCard = ({ event, onInteraction }) => {
  const navigate = useNavigate();
  const [followed, setFollowed] = useState(false);
  const meta = event.metadata || {};
  const actor = event.actor || {};

  const displayName = meta.title || `${actor.firstName || ''} ${actor.lastName || ''}`.trim() || 'Researcher';
  const institution = meta.institution || actor.institution || '';
  const researchArea = meta.researchArea || '';
  const keywords = meta.keywords || [];
  const followers = meta.followers || 0;
  const publications = meta.publications || 0;
  const userId = event.entityId;

  const handleFollow = async (e) => {
    e.stopPropagation();
    try {
      await feedService.toggleFollow(userId);
      setFollowed(prev => !prev);
      onInteraction?.(event._id, 'follow');
      toast.success(followed ? 'Unfollowed' : `Following ${displayName}`);
    } catch { toast.error('Could not follow.'); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-card border border-border-default rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer group"
      onClick={() => navigate(`/profile/${meta.profileSlug || actor.profileSlug || userId || actor._id}`)}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Avatar
          src={meta.avatar || actor.profileImage}
          name={displayName}
          size="lg"
          showBorder
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors truncate">{displayName}</h3>
          {institution && (
            <p className="flex items-center gap-1 text-xs text-text-muted mt-0.5">
              <Building2 size={11} />{institution}
            </p>
          )}
          {researchArea && (
            <p className="text-xs text-primary/80 font-medium mt-1">{researchArea}</p>
          )}

          {/* Keywords */}
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {keywords.slice(0, 3).map((k, i) => (
                <span key={i} className="text-xs bg-bg-surface border border-border-default text-text-muted px-2 py-0.5 rounded-full">{k}</span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
            <span className="flex items-center gap-1"><Users size={12} />{followers.toLocaleString()} followers</span>
            <span className="flex items-center gap-1"><BookOpen size={12} />{publications} papers</span>
          </div>
        </div>

        {/* Follow CTA */}
        <button
          onClick={handleFollow}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 shrink-0 ${
            followed
              ? 'bg-bg-surface text-text-muted border border-border-default'
              : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
          }`}
        >
          {followed ? <><Check size={13} />Following</> : <><UserPlus size={13} />Follow</>}
        </button>
      </div>
    </motion.div>
  );
};

export default ResearcherFeedCard;
