import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Grid, List, Bookmark, Heart, Users, Calendar, ArrowUpRight, Filter, SortAsc } from 'lucide-react';
import { toast } from 'react-hot-toast';
import projectService from '../services/project.service';
import { useAuth } from '../../../context/AuthContext';
import ApplyModal from '../components/ApplyModal';

const domains = [
  'Artificial Intelligence', 'Machine Learning', 'Healthcare', 'Blockchain', 'IoT',
  'Cybersecurity', 'Robotics', 'Cloud Computing', 'Bioinformatics', 'Computer Vision',
  'Natural Language Processing', 'Material Science', 'Quantum Computing', 'Other'
];

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('all'); // all, owned, collaborating, bookmarked
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('-createdAt');
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [page, setPage] = useState(1);
  const [applyingProject, setApplyingProject] = useState(null);
  
  // Real network connection tracking
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getErrorMessage = (err) => {
    if (!isOnline || err?.isOffline) return 'No internet connection.';
    if (err?.isTimeout || err?.status === 408) return 'Server is taking longer than expected.';
    const status = err?.status || err?.error?.status || err?.response?.status;
    if (status === 401) return 'Session expired. Please login again.';
    if (status === 403) return "You don't have permission.";
    if (status === 404) return 'Projects not found.';
    if (status === 500) return 'Internal server error.';
    if (status === 503) return 'Service temporarily unavailable.';
    return err?.message || err?.error?.message || 'Something went wrong. Please try again.';
  };

  // 1. Fetch Projects list
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', activeTab, search, domain, status, sortBy, page],
    queryFn: async () => {
      const params = { page, limit: 12, search, researchDomain: domain, status, sort: sortBy };

      if (activeTab === 'owned') {
        const res = await projectService.getMyProjects(params);
        return res.data; // { docs, total, page, limit, totalPages }
      }

      if (activeTab === 'bookmarked') {
        const res = await projectService.getBookmarkedProjects(params);
        // The bookmarks endpoint returns bookmark records, not project objects —
        // the real project data lives nested under `projectId`. Flatten it here
        // so the card UI below (which expects project.title, project.status, etc.)
        // renders correctly, and so clicks/toggles use the real project _id
        // instead of the bookmark record's _id.
        return {
          ...res.data,
          docs: (res.data.docs || []).map((bookmark) => ({
            ...(bookmark.projectId || {}),
            _id: bookmark.projectId?._id,
          })),
        };
      }

      if (activeTab === 'collaborating') {
        const res = await projectService.listProjects({ ...params, collaborating: true });
        return res.data;
      }

      const res = await projectService.listProjects(params);
      return res.data; // { docs, total, page, limit, totalPages }
    },
    placeholderData: (previousData) => previousData,
    // Retry 3 times with exponential backoff (500ms, 1s, 2s) for GET requests
    retry: (failureCount, err) => {
      if (err?.isCanceled) return false;
      return failureCount < 3;
    },
    retryDelay: (attempt) => [500, 1000, 2000][attempt] || 2000,
  });

  // 2. Fetch owner stats if authenticated
  const { data: stats } = useQuery({
    queryKey: ['projects:stats:owner'],
    queryFn: async () => {
      const res = await projectService.getOwnerStats();
      return res.data;
    },
    enabled: !!user,
    retry: (failureCount, err) => {
      if (err?.isCanceled) return false;
      return failureCount < 3;
    },
    retryDelay: (attempt) => [500, 1000, 2000][attempt] || 2000,
  });

  // 3. Fetch bookmark count for the Workspace Overview card.
  // Reuses the existing bookmarks endpoint (limit: 1, we only need `total`)
  // instead of requiring a backend change to the owner-stats endpoint.
  const { data: bookmarkStats } = useQuery({
    queryKey: ['projects:stats:bookmarks'],
    queryFn: async () => {
      const res = await projectService.getBookmarkedProjects({ page: 1, limit: 1 });
      return res.data; // { total, ... }
    },
    enabled: !!user,
    retry: (failureCount, err) => {
      if (err?.isCanceled) return false;
      return failureCount < 3;
    },
    retryDelay: (attempt) => [500, 1000, 2000][attempt] || 2000,
  });

  // Bookmark toggle mutation
  const bookmarkMutation = useMutation({
    mutationFn: ({ projectId, type }) => projectService.toggleBookmark(projectId, type),
    onSuccess: (res, variables) => {
      toast.success(res.message || `Project ${res.data.action} successfully.`);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleApplyClick = (project, e) => {
    e.stopPropagation();
    setApplyingProject(project);
  };

  const handleApplySubmit = async (answers, message) => {
    try {
      await projectService.applyToProject(applyingProject._id, {
        screeningAnswers: answers,
        message
      });
      toast.success('Application submitted successfully.');
      setApplyingProject(null);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch (err) {
      toast.error(err.message || 'Failed to submit application.');
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-16 font-sans">
      {/* Stats Header (collaboration overview) */}
      {user && stats && (
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-5 sm:py-6 mb-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-4">Workspace Overview</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {[
                { label: 'Total Projects', count: stats.totalProjects, color: 'text-blue-600 bg-blue-50' },
                { label: 'Collaborators', count: stats.totalMembers, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Applications', count: stats.totalApplications, color: 'text-amber-600 bg-amber-50' },
                { label: 'Total Views', count: stats.totalViews, color: 'text-purple-600 bg-purple-50' },
                { label: 'Bookmarks', count: bookmarkStats?.total || 0, color: 'text-rose-600 bg-rose-50' }
              ].map((s, idx, arr) => (
                <div
                  key={idx}
                  className={`border border-slate-100 rounded-xl p-3 sm:p-4 bg-white shadow-sm flex flex-col items-center text-center gap-2 sm:flex-row sm:items-center sm:text-left sm:gap-4 ${
                    idx === arr.length - 1 ? 'col-span-2 sm:col-span-1' : ''
                  }`}
                >
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg flex items-center justify-center font-bold text-base sm:text-lg ${s.color}`}>
                    {s.count}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wide leading-tight">{s.label}</p>
                    <p className="text-base sm:text-lg font-extrabold text-slate-800">{s.count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Sub-header & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Research Projects</h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Explore active research projects and join collaboration rooms</p>
          </div>
          {user && (
            <button
              onClick={() => navigate('/projects/create')}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-blue-650 text-white rounded-xl px-4 py-2.5 text-xs font-black shadow-lg shadow-blue-650/15 hover:bg-blue-700 transition"
            >
              <Plus size={16} /> Start Project
            </button>
          )}
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 mb-6 gap-4 sm:gap-6 overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', label: 'All Projects' },
            { id: 'owned', label: 'Owned by Me', count: stats?.totalProjects },
            { id: 'collaborating', label: 'Collaborating' },
            { id: 'bookmarked', label: 'Bookmarked' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setPage(1); }}
                className={`py-3 text-xs font-black relative shrink-0 border-b-2 transition ${
                  isActive ? 'text-blue-650 border-blue-650' : 'text-slate-550 border-transparent hover:text-slate-700'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-blue-50 text-blue-650' : 'bg-slate-100 text-slate-500'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search, Filter, & Sort Controls */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-sm mb-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects by title, keywords, tags..."
              className="w-full bg-slate-50 rounded-xl border border-slate-150 pl-10 pr-4 py-2.5 sm:py-2 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            {/* Domain Filter */}
            <div className="relative col-span-2 sm:col-auto">
              <Filter size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 rounded-xl border border-slate-150 pl-8 pr-3 py-2.5 sm:py-2 text-xs font-bold text-slate-600 outline-none hover:bg-slate-100 cursor-pointer"
              >
                <option value="">All Domains</option>
                {domains.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 rounded-xl border border-slate-150 px-3 py-2.5 sm:py-2 text-xs font-bold text-slate-600 outline-none hover:bg-slate-100 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="recruiting">Recruiting</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>

            {/* Sort Dropdown */}
            <div className="relative">
              <SortAsc size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 rounded-xl border border-slate-150 pl-8 pr-3 py-2.5 sm:py-2 text-xs font-bold text-slate-600 outline-none hover:bg-slate-100 cursor-pointer"
              >
                <option value="-createdAt">Newest</option>
                <option value="createdAt">Oldest</option>
                <option value="-viewCount">Popular</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="col-span-2 sm:col-auto flex justify-center sm:justify-start border border-slate-200 rounded-xl overflow-hidden p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 sm:flex-none flex items-center justify-center p-2 sm:p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Grid size={15} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 sm:flex-none flex items-center justify-center p-2 sm:p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-1/3" />
                <div className="h-6 bg-slate-100 rounded w-3/4" />
                <div className="h-16 bg-slate-100 rounded" />
                <div className="flex gap-2">
                  <div className="h-5 bg-slate-100 rounded w-12" />
                  <div className="h-5 bg-slate-100 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-150 rounded-2xl p-6 text-center text-red-650 font-bold">
            {getErrorMessage(error)}
          </div>
        ) : data?.docs?.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 sm:p-16 text-center shadow-sm">
            <Users size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-base font-extrabold text-slate-800">No Projects Found</h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">Try relaxing your search query or filters.</p>
          </div>
        ) : (
          /* Projects Render Grid/List */
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' : 'space-y-4'}>
            {data?.docs?.map((project) => {
              const isOwner = user && project.owner?._id === user._id;
              const hasApplied = false; // logic resolved by API if needed

              return (
                <div
                  key={project._id}
                  onClick={() => navigate(`/projects/${project._id}`)}
                  className={`bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer flex flex-col overflow-hidden group ${
                    viewMode === 'list' ? 'sm:flex-row items-stretch sm:items-center p-4 gap-4' : ''
                  }`}
                >
                  {/* Thumbnail / Cover */}
                  <div className={`relative bg-gradient-to-br from-blue-700 via-slate-800 to-slate-900 flex items-center justify-center shrink-0 ${
                    viewMode === 'list' ? 'w-full h-32 sm:w-24 sm:h-20 rounded-xl' : 'h-36 w-full'
                  }`}>
                    {project.coverImage ? (
                      <img src={project.coverImage} alt={project.title} className="w-full h-full object-cover" />
                    ) : (
                      <Users size={32} className="text-white/20" />
                    )}

                    {/* Status Badge */}
                    <span className={`absolute top-3 left-3 text-[9px] uppercase font-black px-2 py-0.5 rounded-full tracking-wider shadow-sm text-white ${
                      project.status === 'recruiting' ? 'bg-emerald-500' : project.status === 'active' ? 'bg-blue-600' : 'bg-slate-500'
                    }`}>
                      {project.status}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
                        {project.researchDomain}
                      </span>
                      <h3 className="text-sm font-extrabold text-slate-800 group-hover:text-blue-650 transition mt-1 truncate">
                        {project.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold line-clamp-2 mt-1 leading-relaxed">
                        {project.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-semibold">
                      <div className="flex items-center gap-1">
                        <Users size={12} />
                        <span>{project.memberCount || 1} members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOwner && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/projects/${project._id}/edit`);
                            }}
                            className="hover:text-blue-650 text-blue-600 font-black text-[10px] uppercase border border-slate-150 px-2 py-0.5 rounded hover:bg-slate-50 transition"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            bookmarkMutation.mutate({ projectId: project._id, type: 'star' });
                          }}
                          className="hover:text-amber-500 transition flex items-center gap-0.5"
                          aria-label="Star project"
                        >
                          <Heart size={12} />
                          <span>{project.starCount || 0}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            bookmarkMutation.mutate({ projectId: project._id, type: 'bookmark' });
                          }}
                          className="hover:text-blue-500 transition"
                          aria-label="Bookmark project"
                        >
                          <Bookmark size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8 sm:mt-12">
            {Array.from({ length: data.totalPages }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-black border transition ${
                    page === p
                      ? 'bg-blue-650 text-white border-blue-650 shadow-md shadow-blue-650/10'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {applyingProject && (
        <ApplyModal
          project={applyingProject}
          isOpen={!!applyingProject}
          onClose={() => setApplyingProject(null)}
          onSubmit={handleApplySubmit}
        />
      )}
    </div>
  );
}