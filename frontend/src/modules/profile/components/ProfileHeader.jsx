import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Share2, 
  UserPlus, 
  MessageSquare, 
  CheckCircle, 
  Edit2, 
  GraduationCap, 
  Award, 
  Linkedin, 
  Globe, 
  Database,
  Bookmark,
  Camera,
  HeartHandshake,
  ArrowLeft
} from 'lucide-react';
import ProfileAvatar from './ProfileAvatar';
import { 
  GoogleScholarIcon, 
  OrcidIcon, 
  ScopusIcon, 
  LinkedinIcon, 
  ResearchGateIcon, 
  WebsiteIcon 
} from './BrandIcons';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import FollowButton from '../../follow/components/FollowButton';
import ConnectButton from '../../connections/components/ConnectButton';
import MutualFollowers from '../../follow/components/MutualFollowers';
import followService from '../../follow/services/follow.service';


const ProfileHeader = ({ 
  profile, 
  user, 
  onEdit, 
  onShare, 
  onConnect, 
  onFollow, 
  onAvatarChange,
  onCoverChange,
  isFollowing = false, 
  isConnected = false, 
  isOwnProfile = false, 
  onSync 
}) => {
  const defaultCover = 'https://iili.io/C7pZ8Ss.jpg';
  const navigate = useNavigate();

  // Fetch follow status for mutual followers preview
  const { data: followStatus } = useQuery({
    queryKey: ['followStatus', profile?.userId],
    queryFn: async () => {
      const res = await followService.getFollowStatus(profile.userId);
      return res.data;
    },
    enabled: !!profile?.userId && !isOwnProfile
  });

  const socialIcons = {

    googleScholar: { icon: GoogleScholarIcon, label: 'Google Scholar', color: 'hover:bg-slate-50 border-slate-100 hover:border-blue-300' },
    orcid: { icon: OrcidIcon, label: 'ORCID', color: 'hover:bg-slate-50 border-slate-100 hover:border-green-300' },
    linkedin: { icon: LinkedinIcon, label: 'LinkedIn', color: 'hover:bg-slate-50 border-slate-100 hover:border-blue-400' },
    researchGate: { icon: ResearchGateIcon, label: 'ResearchGate', color: 'hover:bg-slate-50 border-slate-100 hover:border-teal-300' },
    scopus: { icon: ScopusIcon, label: 'Scopus', color: 'hover:bg-slate-50 border-slate-100 hover:border-orange-300' },
    website: { icon: WebsiteIcon, label: 'Website', color: 'hover:bg-slate-50 border-slate-100 hover:border-indigo-300' }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-3xl overflow-hidden border border-border shadow-sm"
    >
      {/* Cover Image */}
      <div className="h-36 sm:h-48 relative w-full overflow-hidden group">
        <img
          src={profile?.coverImage || defaultCover}
          alt="Profile Cover"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {!isOwnProfile && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 bg-black/60 hover:bg-black/80 text-white border border-white/20 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer backdrop-blur-sm transition-all active:scale-95 z-20"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        )}

        {isOwnProfile && (
          <button
            type="button"
            onClick={() => onCoverChange && onCoverChange()}
            className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white border border-white/20 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer backdrop-blur-sm transition-all active:scale-95 z-20"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Change Cover</span>
          </button>
        )}

      </div>

      {/* Profile Details Area */}
      <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row md:items-center gap-6">
        
        {/* Avatar Wrapper with negative margin */}
        <div className="-mt-20 sm:-mt-24 relative z-10">
          <ProfileAvatar 
            imageUrl={profile?.profileImage || user?.profileImage} 
            name={user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`}
            onAvatarChange={onAvatarChange} 
            editable={isOwnProfile}
          />
        </div>

        {/* Bio Details */}
        <div className="flex-grow space-y-1 mt-4 md:mt-0 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight leading-none">
              {user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`}
            </h2>
            <CheckCircle className="w-5 h-5 text-primary fill-primary/10" title="Verified Researcher" />
          </div>

          {profile?.designation && (
            <p className="text-xs sm:text-sm font-bold text-primary leading-tight">
              {profile.designation} 
              {profile.department && ` @ ${profile.department}`}
            </p>
          )}

          {profile?.institution && (
            <p className="text-xs text-text-secondary font-medium leading-none">
              {profile.institution}
            </p>
          )}

          <div className="flex items-center gap-1.5 text-xs text-text-secondary font-semibold">
            <MapPin className="w-3.5 h-3.5" />
            <span>{profile?.country || user?.country || 'Global'}</span>
          </div>

          {/* Followers, Following & Connections count block */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1.5 text-xs font-bold text-slate-500">
            <Link to={`/profile/${profile?.profileSlug || profile?.username || 'me'}/followers`} className="hover:text-[#2563EB] transition-colors">
              <span className="text-[#0F172A] font-black">{profile?.followersCount || 0}</span> Followers
            </Link>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <Link to={`/profile/${profile?.profileSlug || profile?.username || 'me'}/following`} className="hover:text-[#2563EB] transition-colors">
              <span className="text-[#0F172A] font-black">{profile?.followingCount || 0}</span> Following
            </Link>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <Link to={`/profile/${profile?.profileSlug || profile?.username || 'me'}/connections`} className="hover:text-[#2563EB] transition-colors">
              <span className="text-[#0F172A] font-black">{profile?.connectionsCount || 0}</span> Connections
            </Link>
          </div>

          {/* Mutual followers preview stack */}
          {!isOwnProfile && followStatus && followStatus.mutualCount > 0 && (
            <div className="pt-2">
              <MutualFollowers mutualCount={followStatus.mutualCount} mutualPreview={followStatus.mutualPreview || []} />
            </div>
          )}

          {/* Open to Opportunities Block */}
          <div className="flex items-center gap-1.5 pt-1 text-xs text-text-secondary">
            <HeartHandshake className="w-3.5 h-3.5 text-accent-indigo" />
            <span className="font-extrabold uppercase text-[9px] tracking-wider text-text-secondary">Open to:</span>
            <div className="flex flex-wrap gap-1">
              {profile?.openToCollaborate && (
                <span className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-md">Collaborations</span>
              )}
              {profile?.openToMentor && (
                <span className="text-[9px] bg-teal-50 border border-teal-100 text-teal-700 font-bold px-1.5 py-0.5 rounded-md">Mentorship</span>
              )}
              {profile?.openToResearch && (
                <span className="text-[9px] bg-blue-50 border border-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-md">Joint Research</span>
              )}
              {!profile?.openToCollaborate && !profile?.openToMentor && !profile?.openToResearch && (
                <span className="text-[10px] text-text-secondary italic font-medium">None specified</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0 self-start md:self-end">
          {isOwnProfile ? (
            <>
              {profile?.socialLinks?.googleScholar && (
                <button
                  onClick={onSync}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-md shadow-primary/10 transition-all active:scale-95"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  Sync Scholar
                </button>
              )}
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 px-4 py-2 border border-border bg-white rounded-xl text-xs font-bold text-text-secondary hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Profile
              </button>
              <button
                onClick={onShare}
                className="flex items-center gap-1.5 px-4 py-2 border border-border bg-white rounded-xl text-xs font-bold text-text-secondary hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95"
                title="Share Profile"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onShare}
                className="flex items-center gap-1.5 px-4 py-2 border border-border bg-white rounded-xl text-xs font-bold text-text-secondary hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95"
                title="Share Profile"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
              <FollowButton targetUserId={profile?.userId} username={profile?.profileSlug || profile?.username} />
              <ConnectButton targetUserId={profile?.userId} username={profile?.profileSlug || profile?.username} />
              {(isConnected || isFollowing) && (
                <Link
                  to={`/messages?user=${profile?.userId}`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-650 hover:bg-blue-700 hover:scale-105 active:scale-95 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-500/10"
                >
                  <MessageSquare className="w-3.5 h-3.5 fill-white text-white" />
                  <span>Message</span>
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* Social and Portfolios Links bar */}
      <div className="border-t border-border px-6 py-4 flex flex-wrap items-center justify-between gap-4 bg-bg-page/20">
        <div className="flex flex-wrap items-center gap-2.5">
          {Object.entries(socialIcons).map(([key, config]) => {
            const url = profile?.socialLinks?.[key];
            if (!url) return null;
            const Icon = config.icon;
            return (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 border border-slate-300 bg-white rounded-xl text-text-secondary transition-all ${config.color}`}
                title={config.label}
              >
                <Icon className="w-5 h-5" />
              </a>
            );
          })}
        </div>
        
        {profile?.bio && (
          <p className="text-xs text-text-secondary max-w-lg italic font-medium leading-relaxed">
            "{profile.bio}"
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default ProfileHeader;