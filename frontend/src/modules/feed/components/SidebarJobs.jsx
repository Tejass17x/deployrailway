import React from 'react';
import { Briefcase, Building2, MapPin, GraduationCap, ExternalLink } from 'lucide-react';

const SidebarJobs = ({ jobs = [] }) => {
  if (!jobs.length) return null;

  return (
    <div className="bg-bg-card border border-border-default rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
          <GraduationCap size={14} className="text-purple-400" />
        </div>
        <h3 className="text-sm font-bold text-text-primary">Academic Jobs</h3>
      </div>

      <div className="space-y-3">
        {jobs.slice(0, 4).map((job, idx) => {
          const meta = job.metadata || {};
          const title = meta.title || job.title || 'Academic Position';
          const institution = meta.institution || job.institution || '';
          const location = meta.location || job.location || '';
          const jobType = meta.tags?.[0] || 'Research';
          const applyUrl = meta.applyUrl || job.applyUrl || '#';

          const typeColor = {
            'PhD':      'text-purple-400 bg-purple-500/10',
            'Postdoc':  'text-blue-400 bg-blue-500/10',
            'Faculty':  'text-amber-400 bg-amber-500/10',
            'Research': 'text-emerald-400 bg-emerald-500/10',
          }[jobType] || 'text-text-muted bg-bg-surface';

          return (
            <div key={idx} className="border-l-2 border-purple-500/30 pl-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-xs font-semibold text-text-primary line-clamp-2 leading-snug flex-1">{title}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium shrink-0 ${typeColor}`}>
                  {jobType}
                </span>
              </div>
              {institution && (
                <p className="flex items-center gap-1 text-xs text-text-muted">
                  <Building2 size={9} />{institution}
                </p>
              )}
              {location && (
                <p className="flex items-center gap-1 text-xs text-text-muted">
                  <MapPin size={9} />{location}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <button className="mt-3 w-full text-xs text-primary font-semibold flex items-center justify-center gap-1 hover:text-primary/80 transition-colors py-1">
        Browse All Jobs <ExternalLink size={11} />
      </button>
    </div>
  );
};

export default SidebarJobs;
