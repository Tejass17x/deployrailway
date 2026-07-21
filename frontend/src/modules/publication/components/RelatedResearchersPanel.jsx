import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { User, BookOpen, GraduationCap, Loader2 } from 'lucide-react';
import publicationService from '../../../services/publication.service';

const RelatedResearchersPanel = ({ publicationId }) => {
  const { data: researchers = [], isLoading } = useQuery({
    queryKey: ['related-researchers', publicationId],
    queryFn: async () => {
      const res = await publicationService.getRelatedResearchers(publicationId, 5);
      return res.success ? res.data : [];
    },
    enabled: !!publicationId,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
        Related Researchers
      </h3>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
        </div>
      ) : researchers.length === 0 ? (
        <div className="text-center py-6 space-y-2">
          <User className="w-8 h-8 text-slate-200 mx-auto" />
          <p className="text-[11px] text-slate-400">No related researchers found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {researchers.map((r) => {
            const slug = r.profileSlug || r.username || r._id;
            return (
              <Link
                key={r._id || r.id}
                to={`/profile/${slug}`}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all group"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-black text-blue-700 flex-shrink-0">
                  {(r.fullName || r.name || '?').charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate transition-colors">
                    {r.fullName || r.name}
                  </p>
                  {r.institution && (
                    <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                      <GraduationCap className="w-2.5 h-2.5 flex-shrink-0" />
                      {r.institution}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    {r.publicationCount > 0 && (
                      <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                        <BookOpen className="w-2.5 h-2.5" />
                        {r.publicationCount} pubs
                      </span>
                    )}
                    {r.citationCount > 0 && (
                      <span className="text-[9px] text-slate-400">
                        {r.citationCount} citations
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RelatedResearchersPanel;
