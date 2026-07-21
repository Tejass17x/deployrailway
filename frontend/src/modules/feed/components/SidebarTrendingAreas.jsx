import React from 'react';
import { TrendingUp, Activity } from 'lucide-react';

const SidebarTrendingAreas = ({ areas = [] }) => {
  if (!areas.length) return null;

  const maxCount = Math.max(...areas.map(a => a.count), 1);

  return (
    <div className="bg-bg-card border border-border-default rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <TrendingUp size={14} className="text-primary" />
        </div>
        <h3 className="text-sm font-bold text-text-primary">Trending Research Areas</h3>
      </div>

      <div className="space-y-3">
        {areas.map((area, idx) => (
          <div key={idx} className="group cursor-pointer">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-text-primary group-hover:text-primary transition-colors truncate pr-2">
                {area.area}
              </span>
              <span className="text-xs text-text-muted shrink-0">{area.count}</span>
            </div>
            <div className="h-1 bg-bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                style={{ width: `${(area.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SidebarTrendingAreas;
