import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Milestone, Plus, CheckCircle, Trash, Calendar, AlignLeft, RefreshCw } from 'lucide-react';
import projectService from '../services/project.service';
import { toast } from 'react-hot-toast';

export default function MilestoneTracker({ projectId, permissions }) {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', targetDate: '', color: '#6366f1' });

  // 1. Fetch milestones
  const { data: milestones = [], isLoading, refetch } = useQuery({
    queryKey: ['project:milestones', projectId],
    queryFn: async () => {
      const res = await projectService.listMilestones(projectId);
      return res.data;
    },
    enabled: !!projectId,
  });

  // 2. Create milestone mutation
  const createMutation = useMutation({
    mutationFn: (data) => projectService.createMilestone(projectId, data),
    onSuccess: () => {
      toast.success('Milestone created.');
      setShowCreateModal(false);
      setNewMilestone({ title: '', description: '', targetDate: '', color: '#6366f1' });
      queryClient.invalidateQueries({ queryKey: ['project:milestones', projectId] });
    },
  });

  // 3. Complete milestone mutation
  const completeMutation = useMutation({
    mutationFn: (milestoneId) => projectService.completeMilestone(projectId, milestoneId),
    onSuccess: () => {
      toast.success('Milestone marked as complete!');
      queryClient.invalidateQueries({ queryKey: ['project:milestones', projectId] });
    },
  });

  // 4. Delete milestone mutation
  const deleteMutation = useMutation({
    mutationFn: (milestoneId) => projectService.deleteMilestone(projectId, milestoneId),
    onSuccess: () => {
      toast.success('Milestone deleted.');
      queryClient.invalidateQueries({ queryKey: ['project:milestones', projectId] });
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newMilestone.title.trim()) return;
    createMutation.mutate(newMilestone);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div>
          <h3 className="font-extrabold text-sm text-slate-800">Research Milestones</h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Define research stages, deliverable checklists, and publish outcomes</p>
        </div>
        {permissions.canManageMilestones && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1 bg-blue-650 text-white px-3.5 py-2 rounded-xl text-xs font-black hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={14} /> Add Milestone
          </button>
        )}
      </div>

      {/* Milestones timeline list */}
      {isLoading ? (
        <p className="text-xs text-slate-400 font-semibold italic text-center py-6">Loading milestones...</p>
      ) : milestones.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm">
          <Milestone size={40} className="mx-auto text-slate-350 mb-3" />
          <h3 className="text-sm font-extrabold text-slate-800">No Milestones Declared</h3>
          <p className="text-xs text-slate-400 font-semibold mt-1">Structure your project timeline to track objectives.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {milestones.map((ms) => (
            <div key={ms._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${ms.color}15`, color: ms.color }}>
                    <Milestone size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-850">{ms.title}</h4>
                    <p className="text-xs text-slate-550 leading-relaxed mt-1">{ms.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {ms.targetDate && (
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold bg-slate-50 border rounded px-2 py-1 shrink-0">
                      <Calendar size={11} /> Due {new Date(ms.targetDate).toLocaleDateString()}
                    </span>
                  )}
                  {permissions.canManageMilestones && !ms.isCompleted && (
                    <button
                      onClick={() => completeMutation.mutate(ms._id)}
                      className="p-1 hover:bg-slate-50 text-slate-400 hover:text-emerald-500 rounded border border-slate-200 transition"
                      title="Mark Complete"
                    >
                      <CheckCircle size={14} />
                    </button>
                  )}
                  {permissions.canManageMilestones && (
                    <button
                      onClick={() => { if (window.confirm('Delete this milestone?')) deleteMutation.mutate(ms._id); }}
                      className="p-1 hover:bg-slate-50 text-slate-400 hover:text-red-500 rounded border border-slate-200 transition"
                      title="Delete"
                    >
                      <Trash size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress and status */}
              <div className="border-t border-slate-50 pt-3 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                  <span>Linked Tasks: {ms.completedTaskCount || 0} / {ms.taskCount || 0}</span>
                  <span className={ms.isCompleted ? 'text-emerald-600' : 'text-blue-650'}>
                    {ms.isCompleted ? 'Achieved' : `${ms.progress || 0}% Complete`}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${ms.isCompleted ? 'bg-emerald-500' : 'bg-blue-650'}`}
                    style={{ width: `${ms.isCompleted ? 100 : ms.progress || 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-base text-slate-900">Define Milestone Stage</h3>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">Milestone Title</label>
              <input
                required
                value={newMilestone.title}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                placeholder="e.g. Stage 1: Data Gathering"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />

              <label className="block text-xs font-semibold text-slate-700">Description</label>
              <textarea
                value={newMilestone.description}
                onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                placeholder="Describe key outcomes for this research phase..."
                rows="3"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={newMilestone.targetDate}
                    onChange={(e) => setNewMilestone({ ...newMilestone, targetDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Color Theme</label>
                  <select
                    value={newMilestone.color}
                    onChange={(e) => setNewMilestone({ ...newMilestone, color: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-650"
                  >
                    <option value="#6366f1">Indigo</option>
                    <option value="#3b82f6">Blue</option>
                    <option value="#10b981">Emerald</option>
                    <option value="#f59e0b">Amber</option>
                    <option value="#ec4899">Pink</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-blue-650 text-white px-4 py-2 text-xs font-black shadow-md hover:bg-blue-700"
              >
                Create Milestone
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
