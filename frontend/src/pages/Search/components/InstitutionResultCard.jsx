import React from 'react';
import { Building2, BookOpen, Users, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const InstitutionResultCard = ({ institution, onBrowse, index = 0 }) => {
  if (!institution) return null;
  const { name, country, website, researchersCount, publicationsCount } = institution;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3.5 sm:p-4 2xl:p-6 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 2xl:gap-5 justify-between"
    >
      <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
          <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] sm:text-[14px] 2xl:text-lg font-bold text-gray-900 truncate">{name}</h3>
          <p className="text-[11px] sm:text-[12px] 2xl:text-sm text-gray-500 font-medium mt-0.5 truncate">{country || 'Academic Institution'}</p>
          
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 2xl:gap-6 mt-1.5 sm:mt-2 2xl:mt-3 text-[10px] sm:text-[11px] 2xl:text-[13px] text-gray-400 font-semibold">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 2xl:w-4 2xl:h-4 text-slate-350 shrink-0" />
              {researchersCount} <span className="hidden sm:inline">researchers</span><span className="sm:hidden">res.</span>
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 2xl:w-4 2xl:h-4 text-slate-350 shrink-0" />
              {publicationsCount} <span className="hidden sm:inline">publications</span><span className="sm:hidden">pubs.</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 justify-between sm:justify-end">
        <div className="sm:hidden"></div> {/* Spacer to push buttons to right on mobile */}
        <div className="flex items-center gap-2">
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 sm:p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg sm:rounded-xl transition-colors"
              title="Visit Website"
            >
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </a>
          )}
          <button
            onClick={() => onBrowse(name)}
            className="px-4 py-1.5 sm:px-4 sm:py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-colors border border-indigo-200 whitespace-nowrap"
          >
            Browse
          </button>
        </div>
      </div>
    </motion.article>
  );
};

export default InstitutionResultCard;
