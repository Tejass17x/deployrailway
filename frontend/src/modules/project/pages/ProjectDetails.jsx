import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, ExternalLink, Github, Users, Globe, Award, Shield, FileText, Heart, Bookmark, CheckCircle2, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import projectService from '../services/project.service';
import { useAuth } from '../../../context/AuthContext';
import ApplyModal from '../components/ApplyModal';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showApplyModal, setShowApplyModal] = useState(false);

  // 1. Fetch public project details
  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await projectService.getProject(id);
      return res.data;
    },
    enabled: !!id,
  });

  // 2. Fetch bookmark status for the user
  const { data: userStatus } = useQuery({
    queryKey: ['project:bookmark-status', id],
    queryFn: async () => {
      const res = await projectService.getBookmarkStatus(id);
      return res.data; // { isBookmarked, isStarred, isFollowing }
    },
    enabled: !!id && !!user,
  });

  // 3. Check if user is an active member
  const { data: myPermissions } = useQuery({
    queryKey: ['project:my-permissions', id],
    queryFn: async () => {
      const res = await projectService.getMyPermissions(id);
      return res.data;
    },
    enabled: !!id && !!user,
    retry: false, // Don't spam if 403 (meaning not a member)
  });

  // Toggle bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: ({ type }) => projectService.toggleBookmark(project?._id, type),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['project:bookmark-status', id] });
    },
  });

  const handleApplySubmit = async (answers, message) => {
    try {
      await projectService.applyToProject(project?._id, {
        screeningAnswers: answers,
        message
      });
      toast.success('Application submitted successfully!');
      setShowApplyModal(false);
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    } catch (err) {
      toast.error(err.message || 'Failed to submit application.');
    }
  };

  useEffect(() => {
    if (!project) return;
    document.title = `${project.title} | Research Connect`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = (project.description || '').slice(0, 160);
  }, [project]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12 animate-pulse space-y-6">
        <div className="h-48 rounded-2xl bg-slate-200" />
        <div className="h-8 w-1/2 rounded bg-slate-200" />
        <div className="h-32 rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="max-w-xl mx-auto my-16 bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">Project Unavailable</h1>
        <p className="text-xs text-slate-400 mt-2">The project you are looking for does not exist or has been archived.</p>
        <button
          onClick={() => navigate('/projects')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-650 px-5 py-2.5 text-xs font-black text-white hover:bg-blue-700 transition"
        >
          <ArrowLeft size={14} /> Back to Projects
        </button>
      </div>
    );
  }

  const isMember = !!myPermissions;

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-16 font-sans">
      <div className="max-w-5xl mx-auto px-6 pt-8">
        {/* Navigation / Actions Row */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-700 transition"
          >
            <ArrowLeft size={15} /> All Projects
          </button>
          
          <div className="flex gap-2">
            {user && project.owner?._id === user._id && (
              <button
                onClick={() => navigate(`/projects/${project._id}/edit`)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                Edit Details
              </button>
            )}
            {isMember && (
              <button
                onClick={() => navigate(`/projects/${project._id}/dashboard`)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-650 px-4 py-2 text-xs font-black text-white shadow-lg shadow-blue-650/15 hover:bg-blue-700 transition"
              >
                Go to Workspace <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Master Banner Header */}
        <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm mb-6">
          <div className="h-44 bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 flex items-center justify-center relative">
            {project.coverImage && (
              <img src={project.coverImage} alt={project.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
            )}
            <span className="absolute top-4 left-4 text-[9px] font-black uppercase tracking-wider bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-white">
              {project.researchDomain}
            </span>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                {project.title}
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={() => bookmarkMutation.mutate({ type: 'star' })}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                    userStatus?.isStarred
                      ? 'bg-amber-50 border-amber-200 text-amber-600'
                      : 'bg-white border-slate-200 text-slate-550 hover:bg-slate-50'
                  }`}
                >
                  <Heart size={14} className={userStatus?.isStarred ? 'fill-amber-500 text-amber-500' : ''} />
                  <span>{project.starCount || 0}</span>
                </button>
                <button
                  onClick={() => bookmarkMutation.mutate({ type: 'bookmark' })}
                  className={`inline-flex items-center rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                    userStatus?.isBookmarked
                      ? 'bg-blue-50 border-blue-200 text-blue-600'
                      : 'bg-white border-slate-200 text-slate-550 hover:bg-slate-50'
                  }`}
                  aria-label="Bookmark"
                >
                  <Bookmark size={14} className={userStatus?.isBookmarked ? 'fill-blue-500 text-blue-500' : ''} />
                </button>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-slate-650 font-medium">
              {project.description}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              {project.tags?.map((tag) => (
                <span key={tag} className="rounded-lg bg-slate-100 text-slate-600 px-2.5 py-0.5 text-xs font-bold">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* Content Layout */}
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Detailed Abstract */}
            {project.longDescription && (
              <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h2 className="text-base font-extrabold text-slate-900 mb-3">Project Abstract</h2>
                <div className="text-sm text-slate-600 leading-relaxed space-y-4 whitespace-pre-line">
                  {project.longDescription}
                </div>
              </section>
            )}

            {/* Research Objectives */}
            <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-base font-extrabold text-slate-900 mb-4">Research Objectives</h2>
              {project.objectives?.length > 0 ? (
                <ul className="space-y-3">
                  {project.objectives.map((obj, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-slate-600">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-650 shrink-0" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 font-semibold italic">No custom objectives declared yet.</p>
              )}
            </section>

            {/* Expected Outcomes */}
            <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-base font-extrabold text-slate-900 mb-4">Expected Outcomes & Deliverables</h2>
              {project.expectedOutcomes?.length > 0 ? (
                <ul className="space-y-3">
                  {project.expectedOutcomes.map((out, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-slate-600">
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{out}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 font-semibold italic">Outcomes not populated.</p>
              )}
            </section>
          </div>

          {/* Right Column / Aside */}
          <div className="space-y-6">
            {/* Call to Action: Recruit / Apply */}
            {!isMember && project.status === 'recruiting' && (
              <div className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-3xl p-6 shadow-md text-white">
                <h3 className="font-extrabold text-base mb-2">Join the Research Team</h3>
                <p className="text-xs text-blue-100 font-medium leading-relaxed mb-4">
                  This project workspace is actively recruiting. Submit your research details and application to get onboarded.
                </p>
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="w-full bg-white text-blue-800 rounded-xl py-3 text-xs font-black hover:bg-slate-50 transition shadow-md"
                >
                  Apply to Collaborate
                </button>
              </div>
            )}

            {/* General Info Metadata */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Project Status</span>
                <span className="flex items-center gap-1.5 text-sm font-extrabold text-slate-800 mt-1 capitalize">
                  <span className={`h-2 w-2 rounded-full ${
                    project.status === 'recruiting' ? 'bg-emerald-500' : project.status === 'active' ? 'bg-blue-600' : 'bg-slate-500'
                  }`} />
                  {project.status}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estimated Duration</span>
                <p className="text-xs font-bold text-slate-700 mt-1">
                  {project.estimatedDuration || 'Ongoing'}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Host Institution</span>
                <p className="text-xs font-bold text-slate-700 mt-1">
                  {project.institution || 'Individual Project'}
                </p>
              </div>

              {project.fundingSource && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Funding Source</span>
                  <p className="text-xs font-bold text-slate-700 mt-1">{project.fundingSource}</p>
                </div>
              )}
            </div>

            {/* Team Members List */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-850 mb-3 flex items-center gap-2">
                <Users size={15} /> Research Team
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                  <span className="font-bold text-slate-800">{project.owner?.fullName || 'Principal Investigator'}</span>
                  <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">PI</span>
                </div>
                {/* Dynamically loads collaborators if returned in query */}
                <p className="text-[10px] text-slate-400 font-semibold text-center py-2">
                  To view full team member permissions, join the project room workspace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <ApplyModal
          project={project}
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
          onSubmit={handleApplySubmit}
        />
      )}
    </div>
  );
}
