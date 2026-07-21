import React from 'react';
import { FileText, TrendingUp, Users, RefreshCw, Activity } from 'lucide-react';

const RecentActivity = ({ activities }) => {
  const getActivityIcon = (action) => {
    switch (action?.toUpperCase()) {
      case 'PUBLICATION_UPLOADED':
        return { icon: FileText, color: 'text-blue-500 bg-blue-50' };
      case 'CITATION_INCREASED':
        return { icon: TrendingUp, color: 'text-indigo-500 bg-indigo-50' };
      case 'NEW_COLLABORATION':
        return { icon: Users, color: 'text-purple-500 bg-purple-50' };
      case 'PROFILE_UPDATED':
        return { icon: RefreshCw, color: 'text-emerald-500 bg-emerald-50' };
      default:
        return { icon: Activity, color: 'text-slate-500 bg-slate-50' };
    }
  };

  const getRelativeTime = (timestamp) => {
    // eslint-disable-next-line react-hooks/purity
    const elapsed = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-6 bg-white border border-border rounded-2xl">
        <Activity className="w-6 h-6 text-text-secondary mx-auto mb-1.5 opacity-40" />
        <p className="text-[11px] font-semibold text-text-secondary">No recent activities</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4">
      <h4 className="text-xs font-bold text-text-primary tracking-tight">Recent Activity</h4>
      
      <div className="space-y-4 relative pl-3.5 border-l border-border/80">
        {activities.slice(0, 5).map((act, idx) => {
          const config = getActivityIcon(act.action);
          const Icon = config.icon;
          return (
            <div key={act._id || idx} className="relative space-y-0.5">
              {/* Bullet node */}
              <div className="absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white bg-primary/70 shadow-sm" />
              
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-primary">
                <span className="text-text-secondary font-medium">
                  {act.description || act.action?.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[10px] text-text-secondary font-medium">
                {getRelativeTime(act.createdAt)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivity;
