import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, Trash2, Archive, ShieldAlert } from 'lucide-react';
import projectService from '../services/project.service';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function ProjectSettings({ projectId, project }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: project?.title || '',
    description: project?.description || '',
    longDescription: project?.longDescription || '',
    visibility: project?.visibility || 'public',
    allowApplications: project?.allowApplications ?? true,
    maxTeamMembers: project?.maxTeamMembers || 10,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => projectService.updateProject(projectId, data),
    onSuccess: () => {
      toast.success('Project details updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['project:workspace', projectId] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => projectService.archiveProject(projectId),
    onSuccess: (res) => {
      toast.success(res.data.isArchived ? 'Project workspace archived.' : 'Project unarchived.');
      queryClient.invalidateQueries({ queryKey: ['project:workspace', projectId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectService.deleteProject(projectId),
    onSuccess: () => {
      toast.success('Project deleted successfully.');
      navigate('/projects');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
          <Settings size={16} /> Workspace Settings
        </h3>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Manage visibility, configurations, and lifecycle parameters</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px] items-start">
        {/* Left: General Settings */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Workspace Configurations</h4>

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">Project Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none"
            />

            <label className="block text-xs font-semibold text-slate-700">Short Description</label>
            <input
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none"
            />

            <label className="block text-xs font-semibold text-slate-700">Detailed Abstract</label>
            <textarea
              value={form.longDescription}
              onChange={(e) => setForm({ ...form, longDescription: e.target.value })}
              rows="5"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Max Team Size</label>
                <input
                  type="number"
                  min="1"
                  value={form.maxTeamMembers}
                  onChange={(e) => setForm({ ...form, maxTeamMembers: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Workspace Visibility</label>
                <select
                  value={form.visibility}
                  onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-650"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pl-1 pt-2">
              <input
                type="checkbox"
                id="allowApps"
                checked={form.allowApplications}
                onChange={(e) => setForm({ ...form, allowApplications: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <label htmlFor="allowApps" className="text-xs font-bold text-slate-700 cursor-pointer">
                Accepting new applications / collaboration requests
              </label>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-650 text-white px-5 py-2.5 text-xs font-black shadow-md hover:bg-blue-700 transition"
            >
              <Save size={14} /> Save Changes
            </button>
          </div>
        </form>

        {/* Right: Danger Zone */}
        <aside className="bg-white border border-red-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h4 className="font-extrabold text-xs text-red-650 uppercase tracking-wide flex items-center gap-1">
            <ShieldAlert size={14} /> Danger Zone
          </h4>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => { if (window.confirm('Toggle archive status for this project?')) archiveMutation.mutate(); }}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-700 rounded-xl py-2.5 text-xs font-black transition flex items-center justify-center gap-1.5"
            >
              <Archive size={14} /> {project?.isArchived ? 'Unarchive Project' : 'Archive Project'}
            </button>

            <button
              onClick={() => { if (window.confirm('WARNING: Are you sure you want to permanently delete this project? This action is irreversible.')) deleteMutation.mutate(); }}
              className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl py-2.5 text-xs font-black transition flex items-center justify-center gap-1.5"
            >
              <Trash2 size={14} /> Delete Project
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
