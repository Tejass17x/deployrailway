import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, MessageSquare, CheckSquare, Milestone, FolderOpen, Megaphone, Users, Settings, ArrowLeft, Loader, ShieldAlert } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveSection } from '../../../redux/slices/projectSlice';

// API & Hooks
import projectService from '../services/project.service';
import { useProjectPermissions } from '../hooks/useProjectPermissions';
import { useProjectSocket } from '../hooks/useProjectSocket';

// Subcomponents
import TaskBoard from '../components/TaskBoard';
import ProjectChat from '../components/ProjectChat';
import FileExplorer from '../components/FileExplorer';
import MemberManagement from '../components/MemberManagement';
import MilestoneTracker from '../components/MilestoneTracker';
import AnnouncementsList from '../components/AnnouncementsList';
import ProjectSettings from '../components/ProjectSettings';
import DashboardOverview from '../components/DashboardOverview';
import ProjectErrorBoundary from '../components/ProjectErrorBoundary';

export default function ProjectDashboard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Active tab state stored in Redux
  const activeSection = useSelector((state) => state.project.activeSection) || 'overview';
  const setActiveTab = (tab) => dispatch(setActiveSection(tab));

  // 1. Fetch project profile details
  const { data: project, isLoading: isProjectLoading, isError } = useQuery({
    queryKey: ['project:workspace', projectId],
    queryFn: async () => {
      const res = await projectService.getProject(projectId);
      return res.data;
    },
    enabled: !!projectId,
    retry: (failureCount, err) => {
      if (err?.isCanceled) return false;
      return failureCount < 3;
    },
    retryDelay: (attempt) => [500, 1000, 2000][attempt] || 2000,
  });

  // 2. Fetch project permissions and role
  const { role, isSuspended, permissions, isOwner, isLoading: isPermsLoading } = useProjectPermissions(projectId);

  // 3. Initialize real-time workspace socket room
  const { typingUsers, emitTyping, emitStopTyping } = useProjectSocket(projectId);

  // Redirect if not a member (or loading fails with forbidden)
  useEffect(() => {
    if (isError) {
      navigate(`/projects/${projectId}`);
    }
  }, [isError, projectId, navigate]);

  if (isProjectLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Loader className="animate-spin text-blue-650" size={32} />
        <p className="text-xs font-black text-slate-550">Loading Workspace Details...</p>
      </div>
    );
  }

  if (!isPermsLoading && isSuspended) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white border border-red-200 rounded-3xl p-8 text-center shadow-sm">
        <ShieldAlert className="text-red-500 mx-auto mb-4" size={48} />
        <h2 className="text-lg font-extrabold text-slate-900">Workspace Access Suspended</h2>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Your access to the project collaboration workspace has been suspended by the administrator. Please contact the project PI for further review.
        </p>
        <button
          onClick={() => navigate('/projects')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-100 border px-5 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-200 transition"
        >
          <ArrowLeft size={14} /> Back to Directory
        </button>
      </div>
    );
  }

  // Section list based on permissions
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'chat', label: 'Team Chat', icon: MessageSquare, enabled: isPermsLoading || permissions?.canSendMessages },
    { id: 'tasks', label: 'Kanban Tasks', icon: CheckSquare, enabled: isPermsLoading || permissions?.canManageTasks || permissions?.canSendMessages },
    { id: 'milestones', label: 'Milestones', icon: Milestone, enabled: true },
    { id: 'files', label: 'File Directory', icon: FolderOpen, enabled: isPermsLoading || permissions?.canManageFiles || true },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, enabled: true },
    { id: 'members', label: 'Team Members', icon: Users, enabled: true },
    { id: 'settings', label: 'Settings', icon: Settings, enabled: isPermsLoading || isOwner || permissions?.canEditProject },
  ];

  return (
    <div className="w-full bg-slate-50 min-h-[calc(100vh-65px)] flex font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-250 bg-white shrink-0 hidden md:flex flex-col justify-between py-6">
        <div>
          {/* Project Title Block */}
          <div className="px-5 mb-6">
            <button
              onClick={() => navigate(`/projects/${projectId}`)}
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition mb-3"
            >
              <ArrowLeft size={12} /> Project Profile
            </button>
            <h2 className="text-sm font-extrabold text-slate-900 truncate leading-snug">{project?.title}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {isPermsLoading ? 'Loading Role...' : role?.replace('-', ' ')}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 px-3">
            {tabs
              .filter((t) => t.enabled !== false)
              .map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-black transition ${
                      isActive
                        ? 'bg-blue-50 text-blue-650'
                        : 'text-slate-550 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
          </nav>
        </div>

        {/* Footer info (online sync indicators) */}
        <div className="px-5 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black text-slate-400">Live Sync Connected</span>
          </div>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="flex-1 overflow-y-auto px-6 py-6 max-w-7xl mx-auto w-full flex">
        {isPermsLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <Loader className="animate-spin text-blue-650" size={24} />
            <p className="text-xs font-bold text-slate-500">Checking Team Permissions...</p>
          </div>
        ) : (
          /* Render sections inside localized Error Boundary for widget isolation */
          <ProjectErrorBoundary key={activeSection}>
            {activeSection === 'overview' && <DashboardOverview projectId={projectId} project={project} />}
            {activeSection === 'chat' && (
              <ProjectChat
                projectId={projectId}
                typingUsers={typingUsers}
                emitTyping={emitTyping}
                emitStopTyping={emitStopTyping}
              />
            )}
            {activeSection === 'tasks' && <TaskBoard projectId={projectId} permissions={permissions} />}
            {activeSection === 'milestones' && <MilestoneTracker projectId={projectId} permissions={permissions} />}
            {activeSection === 'files' && <FileExplorer projectId={projectId} permissions={permissions} />}
            {activeSection === 'announcements' && <AnnouncementsList projectId={projectId} permissions={permissions} />}
            {activeSection === 'members' && <MemberManagement projectId={projectId} permissions={permissions} isOwner={isOwner} />}
            {activeSection === 'settings' && <ProjectSettings projectId={projectId} project={project} />}
          </ProjectErrorBoundary>
        )}
      </main>
    </div>
  );
}
