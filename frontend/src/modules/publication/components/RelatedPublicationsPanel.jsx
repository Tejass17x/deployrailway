import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Eye, Quote, Loader2, ArrowRight } from 'lucide-react';
import publicationService from '../../../services/publication.service';

const RelatedPublicationsPanel = ({ publicationId }) => {
  const { data: related = [], isLoading } = useQuery({
    queryKey: ['related-pubs', publicationId],
    queryFn: async () => {
      const res = await publicationService.getRelatedPublications(publicationId, 5);
      return res.success ? res.data : [];
    },
    enabled: !!publicationId,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
          Related Publications
        </h3>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
        </div>
      ) : related.length === 0 ? (
        <div className="text-center py-6 space-y-2">
          <BookOpen className="w-8 h-8 text-slate-200 mx-auto" />
          <p className="text-[11px] text-slate-400">No related publications found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {related.map((pub) => (
            <Link
              key={pub._id || pub.id}
              to={`/publications/${pub.slug}`}
              className="block group p-3 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all"
            >
              <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700 leading-snug line-clamp-2 transition-colors">
                {pub.title}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                {pub.authors && (
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    {pub.authors}
                  </span>
                )}
                <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                  <Eye className="w-2.5 h-2.5" />
                  {pub.views || 0}
                </span>
                <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                  <Quote className="w-2.5 h-2.5" />
                  {pub.citations || 0}
                </span>
              </div>
              {pub.publicationType && (
                <span className="mt-1.5 inline-block text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                  {pub.publicationType}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default RelatedPublicationsPanel;
