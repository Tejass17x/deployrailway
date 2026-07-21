import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, BookOpen, GraduationCap, MapPin, Award, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Avatar from '../../../components/ui/Avatar';

const ResearcherResultCard = ({ researcher, index = 0 }) => {
  const navigate = useNavigate();

  if (!researcher) return null;
  const { _id, firstName, lastName, fullName, profileImage, profileSlug, username, researcherType, institution, profile } = researcher;
  const displayName = fullName || `${firstName} ${lastName}`;
  const slugToUse = profileSlug || username || _id;

  const citationsCount = profile?.metrics?.totalCitations || 0;
  const publicationsCount = profile?.metrics?.totalPublications || 0;
  const design = profile?.designation || researcherType || 'Researcher';
  const dep = profile?.department || '';
  const country = profile?.institutionLocation?.country || '';
  const areas = profile?.researchAreas || [];

  const initials = firstName && lastName 
    ? `${firstName[0]}${lastName[0]}`.toUpperCase() 
    : displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3.5 sm:p-4 2xl:p-6 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 2xl:gap-5"
    >
      <div className="flex flex-row items-start gap-3 sm:gap-4 w-full sm:w-auto flex-1 min-w-0">
        <div 
          onClick={() => navigate(`/profile/${slugToUse}`)}
          className="cursor-pointer flex-shrink-0 mt-0.5 sm:mt-0"
        >
          <Avatar
            src={profileImage}
            name={displayName}
            size="md"
            shape="rounded-full"
            showBorder
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 
              onClick={() => navigate(`/profile/${slugToUse}`)}
              className="text-[14px] sm:text-[15px] 2xl:text-lg font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
            >
              {displayName}
            </h3>
            {profile?.googleScholarVerified && (
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 fill-blue-500/10 shrink-0" title="Verified Researcher" />
            )}
          </div>

          <p className="text-[11px] sm:text-xs 2xl:text-sm text-gray-500 font-medium mt-0.5">
            {design} {dep && `· ${dep}`}
          </p>

          {institution && (
            <p className="text-[11px] sm:text-[12px] 2xl:text-sm text-gray-600 flex items-center gap-1 mt-1 font-semibold">
              <GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5 2xl:w-4 2xl:h-4 text-gray-400 shrink-0" />
              {institution}
            </p>
          )}

          {country && (
            <p className="text-[11px] sm:text-xs text-gray-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {country}
            </p>
          )}

          {/* Research Areas */}
          {areas.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5 sm:mt-3">
              {areas.slice(0, 3).map((area, i) => (
                <span 
                  key={i} 
                  className="px-2 py-0.5 sm:px-2.5 sm:py-0.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg text-[9px] sm:text-[10px] font-bold"
                >
                  {area}
                </span>
              ))}
              {areas.length > 3 && (
                <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold self-center">
                  +{areas.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Metrics & Actions */}
      <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 flex-shrink-0 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 justify-between sm:justify-end">
        <div className="flex items-center gap-4 sm:gap-4 text-center sm:text-right">
          <div>
            <p className="text-[13px] sm:text-sm font-bold text-slate-800 leading-none">{publicationsCount}</p>
            <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-black tracking-wider mt-1.5">Pubs</p>
          </div>
          <div>
            <p className="text-[13px] sm:text-sm font-bold text-slate-800 leading-none">{citationsCount}</p>
            <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-black tracking-wider mt-1.5">Cites</p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/profile/${slugToUse}`)}
          className="px-3.5 py-1.5 sm:px-4 sm:py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] sm:text-xs font-semibold rounded-lg sm:rounded-xl transition-colors cursor-pointer shadow-sm whitespace-nowrap"
        >
          View Profile
        </button>
      </div>
    </motion.article>
  );
};

export default ResearcherResultCard;
