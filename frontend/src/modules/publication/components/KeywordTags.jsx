import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag } from 'lucide-react';

const KeywordTags = ({ keywords = [], researchAreas = [] }) => {
  const navigate = useNavigate();

  const all = [
    ...researchAreas.map(r => ({ label: r, type: 'area' })),
    ...keywords.map(k => ({ label: k, type: 'keyword' })),
  ];

  if (all.length === 0) return null;

  return (
    <div className="space-y-3">
      {researchAreas.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            Research Areas
          </span>
          <div className="flex flex-wrap gap-1.5">
            {researchAreas.map((area, i) => (
              <button
                key={i}
                onClick={() => navigate(`/search?type=publications&researchArea=${encodeURIComponent(area)}`)}
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <Tag className="w-2.5 h-2.5" />
                {area}
              </button>
            ))}
          </div>
        </div>
      )}

      {keywords.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            Keywords
          </span>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((kw, i) => (
              <button
                key={i}
                onClick={() => navigate(`/search?type=publications&keyword=${encodeURIComponent(kw)}`)}
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KeywordTags;
