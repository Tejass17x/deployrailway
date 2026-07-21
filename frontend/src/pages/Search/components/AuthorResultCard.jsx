import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, BookOpen, Award, ExternalLink, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import Avatar from '../../../components/ui/Avatar';

const AuthorResultCard = ({ author, index = 0 }) => {
  const navigate = useNavigate();

  if (!author) return null;
  const { _id, name, institution, publicationCount, email, profileSlug, userId } = author;

  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
  const colors = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-emerald-100 text-emerald-700', 'bg-orange-100 text-orange-700'];
  const color = colors[name?.charCodeAt(0) % colors.length] || colors[0];

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-4 2xl:p-6 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 2xl:gap-5"
    >
      {/* Avatar */}
      <div 
        onClick={() => (profileSlug || userId) && navigate(`/profile/${profileSlug || userId}`)}
        className={`${profileSlug || userId ? 'cursor-pointer' : ''} flex-shrink-0`}
      >
        <Avatar
          src={author.avatar || author.photo || author.profileImage}
          name={name}
          size="lg"
          shape="rounded-2xl"
          showBorder
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 
          onClick={() => (profileSlug || userId) && navigate(`/profile/${profileSlug || userId}`)}
          className={`text-[13px] sm:text-[14px] 2xl:text-lg font-bold text-gray-900 truncate ${profileSlug || userId ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''}`}
        >
          {name}
        </h3>
        {institution && (
          <p className="text-[11px] sm:text-xs 2xl:text-sm text-gray-500 truncate flex items-center gap-1 mt-0.5 2xl:mt-1">
            <GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5 2xl:w-4 2xl:h-4 flex-shrink-0" />
            {institution}
          </p>
        )}
        <div className="flex items-center gap-3 sm:gap-4 mt-1.5 sm:mt-2">
          {publicationCount !== undefined && (
            <div className="flex items-center gap-1 sm:gap-1.5 text-gray-500">
              <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="text-[10px] sm:text-xs font-medium text-gray-600">{publicationCount}</span>
              <span className="text-[10px] sm:text-xs text-gray-400">publications</span>
            </div>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 justify-end">
        {(profileSlug || userId) && (
          <button
            onClick={() => navigate(`/profile/${profileSlug || userId}`)}
            className="px-3 sm:px-4 py-1 sm:py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] sm:text-xs font-semibold rounded-lg sm:rounded-xl transition-colors border border-slate-200"
          >
            View Profile
          </button>
        )}
        <button
          onClick={() => navigate(`/search?q=${encodeURIComponent(name)}&type=author`)}
          className="px-3 sm:px-4 py-1 sm:py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] sm:text-xs font-semibold rounded-lg sm:rounded-xl transition-colors border border-blue-200"
        >
          View Papers
        </button>
      </div>
    </motion.article>
  );
};

export default AuthorResultCard;
