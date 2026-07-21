import React, { useState } from 'react';
import { useParams, Link, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import collaborationsService from '../services/collaborations.service';
import WorkspaceSidebar from '../components/WorkspaceSidebar';
import ActivityTimeline from '../components/ActivityTimeline';
import MemberCard from '../components/MemberCard';
import TaskCard from '../components/TaskCard';

export default function WorkspaceOverview() {
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState('overview');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['collaboration', slug],
    queryFn: () => collaborationsService.getCollaborationBySlug(slug),
    select: (res) => res.data.data,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-violet-500" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        Workspace not found or access denied.
      </div>
    );
  }

  const { workspace, myRole, members, tasks, files, activities, meetings } = data;

  const stats = [
    { label: 'Members', value: members?.length || 0, color: 'text-violet-400' },
    { label: 'Tasks', value: tasks?.length || 0, color: 'text-cyan-400' },
    { label: 'Files', value: files?.length || 0, color: 'text-emerald-400' },
    { label: 'Meetings', value: meetings?.length || 0, color: 'text-amber-400' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Left Sidebar */}
      <WorkspaceSidebar workspace={workspace} myRole={myRole} activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Workspace Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{workspace.name}</h1>
              {workspace.title && <p className="text-gray-400 mt-1">{workspace.title}</p>}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs px-2 py-1 bg-violet-500/20 text-violet-300 rounded-full border border-violet-500/30">
                  {workspace.researchStage}
                </span>
                <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30">
                  {workspace.visibility}
                </span>
                <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                  {workspace.fundingStatus}
                </span>
                <span className="text-xs text-gray-500">Your role: <span className="text-gray-300">{myRole}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, color }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-gray-400 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Description */}
            {workspace.description && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h2 className="font-semibold text-gray-300 mb-2">About</h2>
                <p className="text-gray-400 text-sm leading-relaxed">{workspace.description}</p>
              </div>
            )}

            {/* Recent Tasks */}
            {tasks?.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h2 className="font-semibold text-gray-300 mb-3">Recent Tasks</h2>
                <div className="space-y-2">
                  {tasks.slice(0, 4).map(task => (
                    <TaskCard key={task._id} task={task} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members?.map(m => (
              <MemberCard key={m._id} member={m.userId} role={m.role} />
            ))}
          </div>
        )}

        {activeTab === 'activity' && (
          <ActivityTimeline activities={activities} />
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-3">
            {tasks?.map(task => (
              <TaskCard key={task._id} task={task} />
            ))}
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="hidden xl:block w-72 p-4 border-l border-gray-800 space-y-4">
        {/* Recent Activity */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {activities?.slice(0, 5).map(a => (
              <div key={a._id} className="text-xs text-gray-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                <span>{a.details}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Meetings */}
        {meetings?.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Upcoming Meetings</h3>
            <div className="space-y-2">
              {meetings.slice(0, 3).map(m => (
                <div key={m._id} className="text-xs">
                  <p className="text-white">{m.title}</p>
                  <p className="text-gray-500">{m.date ? new Date(m.date).toLocaleDateString() : 'TBD'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            {['Invite Member', 'Add Task', 'Upload File', 'Schedule Meeting'].map(action => (
              <button key={action}
                className="w-full text-left text-xs px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-750 text-gray-300 hover:text-white transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
