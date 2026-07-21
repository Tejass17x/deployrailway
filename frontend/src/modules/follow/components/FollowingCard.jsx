import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import FollowButton from './FollowButton';
import UserAvatar from '../../../components/ui/Avatar';

const FollowingCard = ({ following, currentUserId }) => {
  const navigate = useNavigate();
  const { user, profile } = following;

  if (!user) return null;

  const handleCardClick = () => {
    navigate(`/profile/${user.profileSlug || user.username}`);
  };

  const researchAreas = profile?.researchAreas || [];
  const isSelf = currentUserId === user._id;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 text-left relative overflow-hidden">
      <div className="flex gap-4 items-start">
        {/* Avatar */}
        <div className="cursor-pointer shrink-0" onClick={handleCardClick}>
          <UserAvatar user={user} size="lg" showBorder />
        </div>

        {/* User Details */}
        <div className="space-y-1 min-w-0 flex-1">
          <h4 
            onClick={handleCardClick}
            className="text-sm font-black text-[#0F172A] hover:text-[#2563EB] cursor-pointer transition-colors leading-tight truncate"
          >
            {user.fullName}
          </h4>

          {profile?.headline && (
            <p className="text-[11px] font-semibold text-[#475569] leading-snug line-clamp-2">
              {profile.headline}
            </p>
          )}

          {profile?.institution && (
            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{profile.institution}</span>
            </p>
          )}
        </div>
      </div>

      {/* Research Areas (Tags) */}
      {researchAreas.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {researchAreas.slice(0, 3).map((area, idx) => (
            <span
              key={area._id || area.name || idx}
              className="text-[9px] font-black bg-slate-50 border border-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase tracking-wider"
            >
              {area.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer (Follow button) */}
      <div className="flex items-center justify-end border-t border-slate-100 pt-3 mt-1 min-h-[36px]">
        {!isSelf && (
          <FollowButton targetUserId={user._id} username={user.profileSlug || user.username} />
        )}
      </div>
    </div>
  );
};

export default FollowingCard;
