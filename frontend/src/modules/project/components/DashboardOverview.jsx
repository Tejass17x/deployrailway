import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Users, CheckSquare, Milestone, FolderOpen, RefreshCw, BarChart2, Activity } from 'lucide-react';
import projectService from '../services/project.service';

export default function DashboardOverview({ projectId, project }) {
  // 1. Fetch project analytics
  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['project:analytics', projectId],
    queryFn: async () => {
      const res = await projectService.getProjectDashboardAnalytics(projectId);
      return res.data;
    },
    enabled: !!projectId,
  });

  // 2. Fetch project activity timeline logs
  const { data: timeline = [], isLoading: isTimelineLoading } = useQuery({
    queryKey: ['project:activity', projectId],
    queryFn: async () => {
      const res = await projectService.getProjectActivityTimeline(projectId, { limit: 15 });
      return res.data;
    },
    enabled: !!projectId,
  });

  return (
    <div className="space-y-6">
      {/* Overview Intro */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-900 mb-1">Collaboration Workspace</h1>
        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
          Welcome to the active research team portal. View shared goals, track milestones, and communicate in real-time.
        </p>

        {/* Progress bar */}
        <div className="mt-6 border-t border-slate-100 pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-700">Project Workspace Progress</span>
            <span className="text-xs font-black text-blue-650 bg-blue-50 px-2 py-0.5 rounded">
              {project?.progress || 0}% Complete
            </span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-650 rounded-full transition-all duration-500"
              style={{ width: `${project?.progress || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Analytics Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Tasks', count: analytics?.tasks?.total || 0, details: `${analytics?.tasks?.completionRate || 0}% completed`, icon: CheckSquare, color: 'text-blue-650 bg-blue-50 border-blue-100' },
          { label: 'Milestones', count: analytics?.milestones?.total || 0, details: `${analytics?.milestones?.completed || 0} achieved`, icon: Milestone, color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { label: 'Files Uploaded', count: analytics?.files?.count || 0, details: `${analytics?.files?.totalSizeMB || 0} MB`, icon: FolderOpen, color: 'text-purple-600 bg-purple-50 border-purple-100' },
          { label: 'Team Members', count: analytics?.members?.total || 0, details: 'Active researchers', icon: Users, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${stat.color}`}>
                  <Icon size={16} />
                </div>
              </div>
              <p className="text-[10px] uppercase font-black text-slate-400 mt-4 tracking-wider">{stat.label}</p>
              <p className="text-xl font-extrabold text-slate-800 mt-1">{stat.count}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">{stat.details}</p>
            </div>
          );
        })}
      </div>

      {/* Timeline & Activities */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h3 className="font-extrabold text-sm text-slate-850 mb-5 flex items-center gap-2">
          <Activity size={16} className="text-slate-400" /> Recent Activities
        </h3>

        {isTimelineLoading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-slate-50 rounded" />
            ))}
          </div>
        ) : timeline.length === 0 ? (
          <p className="text-xs text-slate-400 font-semibold italic text-center py-4">No recent activity logs.</p>
        ) : (
          <div className="relative border-l-2 border-slate-100 pl-4 ml-2 space-y-5">
            {timeline.map((log) => (
              <div key={log._id} className="relative text-xs">
                {/* Dot */}
                <span className="absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-slate-300 ring-2 ring-slate-100" />
                
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-850">{log.actorId?.fullName}</span>
                  <span className="text-slate-400">{log.description}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
