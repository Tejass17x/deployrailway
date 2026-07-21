import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, FileText, Share2, Shield, Landmark, BookOpen, GraduationCap, X } from 'lucide-react';
import UserAvatar from '../../../components/ui/Avatar';

const ResearcherInfo = ({ participant, conversation, messages = [], onClose }) => {
  if (!participant) return null;

  const {
    firstName,
    lastName,
    profileImage,
    username,
    profileSlug,
    slug,
    institution,
    designation,
    bio,
    skills = [],
    metrics = { researchScore: 0, totalCitations: 0 },
    connectionsCount = 0
  } = participant;

  const fullName = `${firstName} ${lastName}`;

  // Extract shared files from messages
  const sharedFiles = messages.filter(m => m.attachment && !m.deleted);

  // Extract research areas from skills
  const researchAreas = skills.map(s => typeof s === 'string' ? s : s.name);

  // Format start date of conversation
  const startDate = conversation?.createdAt
    ? new Date(conversation.createdAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : '12 May 2024';

  return (
    <div className="h-full min-h-0 flex-1 bg-white lg:border-l border-slate-200 w-full lg:w-80 flex flex-col text-left overflow-y-auto select-none lg:shadow-sm">
      {/* Panel header — lets the user close the Overview after opening it */}
      <div className="flex items-center justify-between px-6 pt-5 pb-1 shrink-0 sticky top-0 bg-white z-10">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Overview</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 -mr-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Close overview"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        )}
      </div>

      <div className="p-6 pt-3 flex flex-col gap-6">
      {/* Profile summary */}
      <div className="flex flex-col items-center text-center space-y-4 pb-6 border-b border-slate-100">
        <div className="relative">
          <UserAvatar
            src={profileImage}
            name={fullName}
            size="2xl"
            isOnline
            showBorder
          />
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
              {fullName}
            </h4>
            <Shield className="w-3.5 h-3.5 text-blue-600 fill-blue-600" title="Verified Researcher" />
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {designation || 'Researcher'}
          </p>
          {institution && (
            <p className="text-xs text-slate-400 font-semibold flex items-center justify-center gap-1 mt-0.5">
              <Landmark className="w-3.5 h-3.5 text-slate-350" />
              <span>{institution}</span>
            </p>
          )}
        </div>

        <Link
          to={`/profile/${slug || profileSlug || username || 'me'}`}
          className="px-6 py-2 border border-blue-600 hover:bg-blue-50/50 rounded-xl text-xs font-bold text-blue-600 transition-colors w-full text-center"
        >
          View Profile
        </Link>
      </div>

      {/* About Section */}
      <div className="space-y-2 pb-5 border-b border-slate-100">
        <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">
          About
        </h5>
        <p className="text-xs text-slate-600 leading-relaxed">
          {bio || `${fullName} is an active researcher in the academic community, focused on collaboration and sharing insights.`}
        </p>
      </div>

      {/* Research Areas tags */}
      <div className="space-y-2.5 pb-5 border-b border-slate-100">
        <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">
          Research Areas
        </h5>
        {researchAreas.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {researchAreas.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1.5 bg-blue-50/60 text-blue-600 hover:bg-blue-100/50 rounded-lg text-[10px] font-bold transition-all"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 font-medium italic">No research areas listed</p>
        )}
      </div>

      {/* Conversation Details */}
      <div className="space-y-3.5">
        <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">
          Conversation Details
        </h5>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-slate-500">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div className="text-xs font-semibold text-slate-600">
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Start Date</span>
              <span>{startDate}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-slate-500">
            <Users className="w-4 h-4 text-slate-400" />
            <div className="text-xs font-semibold text-slate-600">
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Participants</span>
              <span>2</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            <FileText className="w-4 h-4 text-slate-400" />
            <div className="text-xs font-semibold text-slate-600">
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Shared Files</span>
              <span>{sharedFiles.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            <Share2 className="w-4 h-4 text-slate-400" />
            <div className="text-xs font-semibold text-slate-600">
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Mutual Connections</span>
              <span>{connectionsCount}</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default React.memo(ResearcherInfo);
