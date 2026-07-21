import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessaging } from '../../context/MessagingContext';
import { messagingApi } from '../../services/messagingApi';
import { ResearcherSkeleton } from './Skeletons';
import { useCountUp } from '../../hooks/useCountUp';
import { Beaker, Cloud, Globe } from 'lucide-react';
import { toast } from '../ui/Toaster';
import Avatar from '../ui/Avatar';

function IconByName({ name, className, style }) {
  if (name === 'beaker') return <Beaker size={16} className={className} style={style} />;
  if (name === 'cloud') return <Cloud size={16} className={className} style={style} />;
  return <Globe size={16} className={className} style={style} />;
}

export default function ResearcherInfoPanel() {
  const navigate = useNavigate();
  const { activeConversationId, getOtherParticipant } = useMessaging();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const otherParticipant = getOtherParticipant(activeConversationId);
  const userId = otherParticipant?.id;

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    messagingApi.getUserProfile(userId)
      .then(data => {
        if (isMounted) setProfile(data);
      })
      .catch(err => {
        if (isMounted) toast.error("Failed to load profile");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [userId]);

  const citations = useCountUp(profile?.citationsCount, 1500);
  const hIndex = useCountUp(profile?.hIndex, 1000);

  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    if (!isFollowing) {
      toast.success(`You are now following ${profile?.fullName}`);
    } else {
      toast.info(`Unfollowed ${profile?.fullName}`);
    }
  };

  if (!activeConversationId || !otherParticipant) return null;

  return (
    <aside className="w-full h-full flex flex-col overflow-y-auto custom-scrollbar anim-panel-slide-in">
      {isLoading || !profile ? (
        <ResearcherSkeleton />
      ) : (
        <>
          {/* Profile Top */}
          <div className="p-6 flex flex-col items-center text-center border-b border-[#E2E8F0] group">
            <div className="profile-avatar mb-4 cursor-pointer anim-breathe">
              <Avatar
                src={profile.avatarUrlLg || profile.avatarUrl}
                name={profile.fullName}
                size="3xl"
                shape="rounded-2xl"
                className="group-hover:border-[#2563EB] transition-colors duration-300"
                showBorder
              />
            </div>
            <h2 className="font-bold text-lg text-[#0F172A] group-hover:text-[#2563EB] transition-colors">{profile.fullName}</h2>
            <p className="text-sm text-[#475569] mt-0.5">{profile.positionTitle} • {profile.department}</p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => navigate(`/researcher/${userId}`)}
                className="px-4 py-2 bg-[#DBEAFE] text-[#2563EB] rounded-lg text-sm font-semibold hover:bg-[#BFDBFE] transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
              >
                Profile
              </button>
              <button
                onClick={handleFollowToggle}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm ${isFollowing
                    ? 'bg-[#10B981] text-white hover:bg-[#059669] border border-transparent'
                    : 'border border-[#E2E8F0] text-[#0F172A] hover:bg-[#DBEAFE] hover:border-[#BFDBFE] hover:text-[#2563EB]'
                  }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>

          {/* Body sections */}
          <div className="p-6 space-y-7">
            {/* Research Impact */}
            <div className="anim-fade-up" style={{ animationDelay: '200ms' }}>
              <h4 className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-3">
                Research Impact
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] flex-1">
                  <span className="text-[10px] font-bold text-[#64748B] tracking-wider uppercase mb-1 block">Citations</span>
                  <span className="text-2xl font-bold text-[#2563EB] hover-num-pop">{citations.toLocaleString()}</span>
                </div>
                <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] flex-1">
                  <span className="text-[10px] font-bold text-[#64748B] tracking-wider uppercase mb-1 block">H-Index</span>
                  <span className="text-2xl font-bold text-[#2563EB] hover-num-pop">{hIndex}</span>
                </div>
              </div>
            </div>

            {/* Top Publications */}
            {profile.topPublications?.length > 0 && (
              <div className="anim-fade-up" style={{ animationDelay: '300ms' }}>
                <h4 className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-3">
                  Top Publications
                </h4>
                <div className="space-y-4">
                  {profile.topPublications.map((pub, idx) => (
                    <div
                      key={idx}
                      className="pub-row cursor-pointer"
                      onClick={() => window.dispatchEvent(new CustomEvent('openGlobalSearch', { detail: profile.fullName }))}
                    >
                      <p className="pub-title text-sm font-medium text-[#0F172A] line-clamp-2">
                        {pub.title}
                      </p>
                      <p className="text-xs text-[#475569] mt-0.5">{pub.journal} • {pub.year}</p>
                    </div>
                  ))}
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('openGlobalSearch', { detail: profile.fullName }))}
                    className="view-all-btn block mx-auto text-xs font-bold text-[#2563EB] py-1"
                  >
                    View all publications
                  </button>
                </div>
              </div>
            )}

            {/* Shared Projects */}
            {profile.sharedProjects?.length > 0 && (
              <div className="anim-fade-up" style={{ animationDelay: '400ms' }}>
                <h4 className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-3">
                  Shared Projects
                </h4>
                <div className="space-y-2">
                  {profile.sharedProjects.map(proj => (
                    <div key={proj.id} className="project-row flex items-center gap-3 p-2 rounded-lg cursor-pointer">
                      <div
                        className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 border-l-4"
                        style={{ background: proj.bgColor, borderColor: proj.color }}
                      >
                        <IconByName name={proj.icon} className="project-icon" style={{ color: proj.color }} />
                      </div>
                      <span className="text-sm font-medium text-[#0F172A]">{proj.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
