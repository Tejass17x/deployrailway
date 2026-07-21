import React, { useState } from 'react';
import { Users, UserPlus, Check, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import feedService from '../../../services/feed.service';
import Avatar from '../../../components/ui/Avatar';

const SidebarSuggestedResearchers = ({ researchers = [], onFollow }) => {
  const navigate = useNavigate();
  const [followedIds, setFollowedIds] = useState(new Set());

  if (!researchers.length) return null;

  const handleFollow = async (e, userId) => {
    e.stopPropagation();
    try {
      await feedService.toggleFollow(userId);
      setFollowedIds(prev => {
        const next = new Set(prev);
        if (next.has(String(userId))) next.delete(String(userId));
        else next.add(String(userId));
        return next;
      });
      onFollow?.();
      const isFollowed = followedIds.has(String(userId));
      toast.success(isFollowed ? 'Unfollowed' : 'Following!');
    } catch { toast.error('Could not follow.'); }
  };

  return (
    <div className="bg-bg-card border border-border-default rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
          <Users size={14} className="text-accent" />
        </div>
        <h3 className="text-sm font-bold text-text-primary">Suggested Researchers</h3>
      </div>

      <div className="space-y-3">
        {researchers.slice(0, 5).map((r, idx) => {
          const rawUserId = r.userId || r._id;
          const userId = rawUserId ? String(rawUserId) : '';
          const followed = followedIds.has(userId);
          const name = r.name || `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Researcher';
          const targetSlug = r.profileSlug || userId;

          return (
            <div
              key={userId || idx}
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => targetSlug && navigate(`/profile/${targetSlug}`)}
            >
              {/* Avatar */}
              <Avatar
                src={r.avatar}
                name={name}
                size="sm"
                showBorder
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors truncate">{name}</p>
                {r.institution && (
                  <p className="text-xs text-text-muted truncate flex items-center gap-1">
                    <Building2 size={9} />{r.institution}
                  </p>
                )}
              </div>

              {/* Follow button */}
              <button
                onClick={(e) => handleFollow(e, userId)}
                className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  followed
                    ? 'bg-bg-surface text-text-muted border border-border-default'
                    : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                }`}
              >
                {followed ? <Check size={11} /> : <UserPlus size={11} />}
                {followed ? 'Following' : 'Follow'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SidebarSuggestedResearchers;
