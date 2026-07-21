import React from 'react';
import { Calendar, Clock, MapPin, ExternalLink } from 'lucide-react';

const SidebarConferences = ({ conferences = [] }) => {
  if (!conferences.length) return null;

  return (
    <div className="bg-bg-card border border-border-default rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Calendar size={14} className="text-amber-400" />
        </div>
        <h3 className="text-sm font-bold text-text-primary">Upcoming Conferences</h3>
      </div>

      <div className="space-y-3">
        {conferences.slice(0, 4).map((conf, idx) => {
          const deadline = conf.deadline ? new Date(conf.deadline) : null;
          // eslint-disable-next-line react-hooks/purity
          const daysLeft = deadline ? Math.ceil((deadline - Date.now()) / (1000 * 60 * 60 * 24)) : null;
          const name = conf.name || conf.title || conf.metadata?.title || 'Conference';
          const location = conf.location || conf.metadata?.location || '';
          const applyUrl = conf.registrationUrl || conf.metadata?.applyUrl || '#';

          return (
            <div key={idx} className="border-l-2 border-amber-500/30 pl-3">
              <p className="text-xs font-semibold text-text-primary mb-0.5 line-clamp-2 leading-snug">{name}</p>
              {location && (
                <p className="flex items-center gap-1 text-xs text-text-muted mb-0.5">
                  <MapPin size={9} />{location}
                </p>
              )}
              {deadline && (
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1 text-xs text-amber-400">
                    <Clock size={9} />
                    {daysLeft !== null && daysLeft >= 0 ? `${daysLeft}d left` : 'Closed'}
                  </p>
                  <a
                    href={applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-0.5"
                    onClick={e => e.stopPropagation()}
                  >
                    Details <ExternalLink size={9} />
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SidebarConferences;
