import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Plus, Trash, Pin, CheckCircle2, AlertCircle } from 'lucide-react';
import projectService from '../services/project.service';
import { toast } from 'react-hot-toast';

export default function AnnouncementsList({ projectId, permissions }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [ann, setAnn] = useState({ title: '', content: '', isPinned: false });

  // 1. Fetch announcements
  const { data: resData = {}, isLoading } = useQuery({
    queryKey: ['project:announcements', projectId],
    queryFn: async () => {
      const res = await projectService.listAnnouncements(projectId);
      return res.data; // { docs, total, page, limit, totalPages }
    },
    enabled: !!projectId,
  });
  const announcements = resData.docs || [];

  // 2. Create announcement mutation
  const createMutation = useMutation({
    mutationFn: (data) => projectService.createAnnouncement(projectId, data),
    onSuccess: () => {
      toast.success('Announcement posted successfully!');
      setShowCreate(false);
      setAnn({ title: '', content: '', isPinned: false });
      queryClient.invalidateQueries({ queryKey: ['project:announcements', projectId] });
    },
  });

  // 3. Pin toggle mutation
  const pinMutation = useMutation({
    mutationFn: (annId) => projectService.togglePinAnnouncement(projectId, annId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project:announcements', projectId] });
    },
  });

  // 4. Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (annId) => projectService.deleteAnnouncement(projectId, annId),
    onSuccess: () => {
      toast.success('Announcement deleted.');
      queryClient.invalidateQueries({ queryKey: ['project:announcements', projectId] });
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!ann.title.trim() || !ann.content.trim()) return;
    createMutation.mutate(ann);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div>
          <h3 className="font-extrabold text-sm text-slate-800">Team Announcements</h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Post broadcasts and key news items to the collaboration team</p>
        </div>
        {permissions.canManageAnnouncements && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1 bg-blue-650 text-white px-3.5 py-2 rounded-xl text-xs font-black hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={14} /> Broadcast
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px] items-start">
        {/* Left: Announcements List */}
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-xs text-slate-400 font-semibold italic text-center py-6">Loading announcements...</p>
          ) : announcements.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm">
              <Megaphone size={40} className="mx-auto text-slate-350 mb-3" />
              <h3 className="text-sm font-extrabold text-slate-800">No Announcements Posted</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">Keep the research team aligned with broadcast updates.</p>
            </div>
          ) : (
            announcements.map((item) => (
              <div key={item._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 relative group">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-slate-850">{item.title}</h4>
                      {item.isPinned && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          <Pin size={9} /> Pinned
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      Posted by {item.authorId?.fullName || 'PI'} &nbsp;•&nbsp; {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {permissions.canManageAnnouncements && (
                    <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition duration-150">
                      <button
                        onClick={() => pinMutation.mutate(item._id)}
                        className="p-1 hover:bg-slate-50 text-slate-400 hover:text-amber-500 rounded border border-slate-200"
                        title="Toggle Pin"
                      >
                        <Pin size={12} />
                      </button>
                      <button
                        onClick={() => { if (window.confirm('Delete announcement?')) deleteMutation.mutate(item._id); }}
                        className="p-1 hover:bg-slate-50 text-slate-400 hover:text-red-500 rounded border border-slate-200"
                        title="Delete"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line border-t border-slate-50 pt-2">
                  {item.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Right: Broadcast Creator */}
        {showCreate && permissions.canManageAnnouncements && (
          <aside className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Write Broadcast</h4>
            
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                required
                value={ann.title}
                onChange={(e) => setAnn({ ...ann, title: e.target.value })}
                placeholder="Broadcast subject..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
              />

              <textarea
                required
                value={ann.content}
                onChange={(e) => setAnn({ ...ann, content: e.target.value })}
                placeholder="Write message details..."
                rows="4"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
              />

              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer pl-1">
                <input
                  type="checkbox"
                  checked={ann.isPinned}
                  onChange={(e) => setAnn({ ...ann, isPinned: e.target.checked })}
                  className="rounded text-blue-600 w-3.5 h-3.5"
                />
                Pin Announcement
              </label>

              <button
                type="submit"
                className="w-full bg-blue-650 text-white rounded-xl py-2.5 text-xs font-black shadow-md hover:bg-blue-700 transition"
              >
                Publish Broadcast
              </button>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
}
