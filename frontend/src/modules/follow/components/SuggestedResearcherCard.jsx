import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, GraduationCap, BookOpen, Users, HelpCircle, ArrowRight, Check, Mail } from 'lucide-react';
import FollowButton from './FollowButton';
import ConnectButton from '../../connections/components/ConnectButton';
import connectionsService from '../../connections/services/connections.service';
import MutualFollowers from './MutualFollowers';
import UserAvatar from '../../../components/ui/Avatar';

const SuggestedResearcherCard = ({ suggestion, currentUserId }) => {
  const navigate = useNavigate();
  const [showReasons, setShowReasons] = useState(false);
  const { user, profile, mutualFollowers, reasons = [], matchPercentage = 50 } = suggestion;

  // Same query ConnectButton uses internally — read here too so this card can
  // swap in the "People You May Know" amber Pending badge (Network page
  // style) instead of ConnectButton's own Pending look, without touching
  // ConnectButton itself (it's shared with ProfileHeader/ConnectionCard).
  const { data: statusData } = useQuery({
    queryKey: ['connectionStatus', user?._id],
    queryFn: async () => {
      const res = await connectionsService.getConnectionStatus(user._id);
      return res.data;
    },
    enabled: !!user?._id
  });
  const connectionStatus = statusData?.status || 'none';

  if (!user) return null;

  const handleCardClick = () => {
    navigate(`/profile/${user.profileSlug || user.username}`);
  };

  const researchAreas = profile?.researchAreas || [];
  const isSelf = currentUserId === user._id;

  // Color logic for match score
  const getScoreColor = (score) => {
    if (score >= 80) return 'from-emerald-500 to-teal-500 text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 50) return 'from-blue-500 to-indigo-500 text-blue-600 bg-blue-50 border-blue-100';
    return 'from-slate-400 to-slate-500 text-slate-650 bg-slate-50 border-slate-100';
  };

  const scoreClass = getScoreColor(matchPercentage);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(15,23,42,0.08)' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between gap-5 text-left relative overflow-hidden transition-all duration-300 group hover:border-slate-300"
    >
      {/* Top Banner & Match Badge */}
      <div className="flex justify-between items-center w-full">
        {/* Match Percentage Badge */}
        <div className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs ${scoreClass.split(' ').slice(2).join(' ')}`}>
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${matchPercentage >= 80 ? 'bg-emerald-400' : 'bg-blue-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${matchPercentage >= 80 ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
          </span>
          <span>{matchPercentage}% Match</span>
        </div>

        {/* Why this researcher? helper trigger */}
        {reasons.length > 0 && (
          <button 
            onClick={() => setShowReasons(!showReasons)}
            className="text-[10px] text-slate-400 hover:text-blue-600 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
          >
            <span>Why match?</span>
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Expandable Match reasons panel */}
      <AnimatePresence>
        {showReasons && reasons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-xs font-semibold text-slate-650 space-y-2 overflow-hidden shadow-inner"
          >
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-200/60">Match Analysis</p>
            <ul className="space-y-1.5">
              {reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-[10px]">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-4 items-start">
        {/* Avatar Container with glowing effect */}
        <div className="cursor-pointer shrink-0 relative" onClick={handleCardClick}>
          <div className="absolute inset-0 bg-blue-100 rounded-full blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <UserAvatar user={user} size="xl" className="relative z-10 transition-transform duration-300 group-hover:scale-105" />
        </div>

        {/* User Details */}
        <div className="space-y-1 min-w-0 flex-1">
          <h4 
            onClick={handleCardClick}
            className="text-base font-black text-[#0F172A] hover:text-[#2563EB] cursor-pointer transition-colors leading-tight truncate"
          >
            {user.fullName}
          </h4>

          {profile?.headline ? (
            <p className="text-[11px] font-bold text-[#475569] leading-snug line-clamp-2">
              {profile.headline}
            </p>
          ) : (
            <p className="text-[11px] font-bold text-[#475569] leading-snug italic">
              Researcher
            </p>
          )}

          {profile?.institution && (
            <p className="text-[10px] text-[#475569] font-black flex items-center gap-1.5 pt-0.5">
              <GraduationCap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="truncate">{profile.institution}</span>
            </p>
          )}
        </div>
      </div>

      {/* Publications / Followers Mini Stats */}
      <div className="flex items-center gap-4 bg-slate-50/50 rounded-2xl p-2.5 border border-slate-100/80 text-[10px] font-black text-slate-500 uppercase tracking-wider">
        <div className="flex items-center gap-1 flex-1 justify-center border-r border-slate-200">
          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          <span>{profile?.publicationsCount || 0} Pubs</span>
        </div>
        <div className="flex items-center gap-1 flex-1 justify-center">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{profile?.followersCount || 0} Followers</span>
        </div>
      </div>

      {/* Research Areas (Tags) */}
      {researchAreas.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {researchAreas.slice(0, 3).map((area, idx) => (
            <span
              key={area._id || area.name || idx}
              className="text-[9px] font-black bg-blue-50/50 border border-blue-100/40 text-blue-600 px-2 py-0.5 rounded-lg uppercase tracking-wider"
            >
              {area.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer (Mutual followers & Action buttons) */}
      <div className="space-y-4 border-t border-slate-100 pt-4 mt-1">
        <div className="min-h-[28px]">
          {mutualFollowers && mutualFollowers.length > 0 ? (
            <MutualFollowers mutualCount={mutualFollowers.length} mutualPreview={mutualFollowers} />
          ) : (
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">Recommended for collaboration</div>
          )}
        </div>

        {/* Horizontal Actions Grid */}
        <div className="flex items-center gap-2 w-full pt-1">
          {!isSelf && (
            <div className="flex-1 flex gap-2">
              <div className="flex-1 shrink-0">
                {connectionStatus === 'pending_sent' ? (
                  <span className="w-full py-2 bg-amber-50 text-amber-600 text-[10px] font-black uppercase rounded-xl border border-amber-200 flex items-center justify-center gap-1.5 cursor-default">
                    <Mail className="w-3.5 h-3.5" />
                    Pending
                  </span>
                ) : (
                  <ConnectButton 
                    targetUserId={user._id} 
                    username={user.profileSlug || user.username} 
                    className="w-full justify-center text-[10px] font-black uppercase py-2 rounded-xl transition-all flex items-center gap-1 active:scale-97 cursor-pointer"
                  />
                )}
              </div>
              <div className="shrink-0">
                <FollowButton 
                  targetUserId={user._id} 
                  username={user.profileSlug || user.username} 
                />
              </div>
            </div>
          )}
          
          <button
            onClick={handleCardClick}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
            title="View full profile"
          >
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] transition-colors" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
export default SuggestedResearcherCard;