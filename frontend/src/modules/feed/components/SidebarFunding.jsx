import React from 'react';
import { DollarSign, Clock, ExternalLink } from 'lucide-react';

const SidebarFunding = ({ funding = [] }) => {
  if (!funding.length) return null;

  return (
    <div className="bg-bg-card border border-border-default rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <DollarSign size={14} className="text-emerald-400" />
        </div>
        <h3 className="text-sm font-bold text-text-primary">Funding Opportunities</h3>
      </div>

      <div className="space-y-3">
        {funding.slice(0, 4).map((grant, idx) => {
          const meta = grant.metadata || {};
          const deadline = meta.deadline ? new Date(meta.deadline) : null;
          // eslint-disable-next-line react-hooks/purity
          const daysLeft = deadline ? Math.ceil((deadline - Date.now()) / (1000 * 60 * 60 * 24)) : null;
          const title = meta.title || grant.title || 'Research Grant';
          const agency = meta.institution || grant.institution || '';
          const amount = meta.grantAmount || grant.grantAmount || '';

          return (
            <div key={idx} className="border-l-2 border-emerald-500/30 pl-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-text-primary line-clamp-2 leading-snug flex-1">{title}</p>
                {amount && <span className="text-xs font-bold text-emerald-400 shrink-0">{amount}</span>}
              </div>
              {agency && <p className="text-xs text-text-muted mt-0.5">{agency}</p>}
              {deadline && daysLeft !== null && daysLeft >= 0 && (
                <p className="flex items-center gap-1 text-xs text-emerald-400 mt-0.5">
                  <Clock size={9} />{daysLeft}d left
                </p>
              )}
            </div>
          );
        })}
      </div>

      <button className="mt-3 w-full text-xs text-primary font-semibold flex items-center justify-center gap-1 hover:text-primary/80 transition-colors py-1">
        View All Grants <ExternalLink size={11} />
      </button>
    </div>
  );
};

export default SidebarFunding;
