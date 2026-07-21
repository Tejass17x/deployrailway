import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, ShieldAlert, Award, Trash, Key, Check } from 'lucide-react';
import projectService from '../services/project.service';
import { toast } from 'react-hot-toast';

export default function MemberManagement({ projectId, permissions, isOwner }) {
  const queryClient = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ userId: '', role: 'research-collaborator', message: '' });

  // 1. Fetch active team members
  const { data: teamData = {}, isLoading } = useQuery({
    queryKey: ['project:members', projectId],
    queryFn: async () => {
      const res = await projectService.listMembers(projectId);
      return res.data;
    },
    enabled: !!projectId,
  });
  const members = teamData.docs || [];

  // 2. Fetch pending project invitations
  const { data: inviteData = {} } = useQuery({
    queryKey: ['project:invitations', projectId],
    queryFn: async () => {
      const res = await projectService.listInvitations(projectId);
      return res.data;
    },
    enabled: !!projectId && permissions.canManageMembers,
  });
  const invitations = inviteData.docs || [];

  // Mutations
  const inviteMutation = useMutation({
    mutationFn: (data) => projectService.sendInvitation(projectId, data.userId, data.role, data.message),
    onSuccess: () => {
      toast.success('Invitation sent successfully!');
      setShowInviteModal(false);
      setInviteForm({ userId: '', role: 'research-collaborator', message: '' });
      queryClient.invalidateQueries({ queryKey: ['project:invitations', projectId] });
    },
  });

  const cancelInviteMutation = useMutation({
    mutationFn: (inviteId) => projectService.cancelInvitation(projectId, inviteId),
    onSuccess: () => {
      toast.success('Invitation cancelled.');
      queryClient.invalidateQueries({ queryKey: ['project:invitations', projectId] });
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => projectService.assignMemberRole(projectId, userId, role),
    onSuccess: () => {
      toast.success('Member role updated.');
      queryClient.invalidateQueries({ queryKey: ['project:members', projectId] });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ userId, reason }) => projectService.suspendMember(projectId, userId, reason),
    onSuccess: () => {
      toast.success('Member suspended.');
      queryClient.invalidateQueries({ queryKey: ['project:members', projectId] });
    },
  });

  const reinstateMutation = useMutation({
    mutationFn: (userId) => projectService.reinstateMember(projectId, userId),
    onSuccess: () => {
      toast.success('Member reinstated.');
      queryClient.invalidateQueries({ queryKey: ['project:members', projectId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId) => projectService.removeMember(projectId, memberId),
    onSuccess: () => {
      toast.success('Member removed from project.');
      queryClient.invalidateQueries({ queryKey: ['project:members', projectId] });
    },
  });

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    if (!inviteForm.userId.trim()) return;
    inviteMutation.mutate(inviteForm);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div>
          <h3 className="font-extrabold text-sm text-slate-800">Team Roster</h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Manage team members, roles, permissions overrides, and invites</p>
        </div>
        {permissions.canManageMembers && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-1 bg-blue-650 text-white px-3.5 py-2 rounded-xl text-xs font-black hover:bg-blue-700 transition shadow-sm"
          >
            <UserPlus size={14} /> Invite Researcher
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px] items-start">
        {/* Left: Active Members */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm min-h-[400px] space-y-4">
          <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Active Members ({members.length})</h4>

          {isLoading ? (
            <p className="text-xs text-slate-400 font-semibold italic text-center py-6">Loading members...</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map((member) => {
                const userObj = member.userId;
                const isPI = member.role === 'principal-investigator';

                return (
                  <div key={member._id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-50 border text-slate-600 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {userObj?.firstName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-800">{userObj?.fullName}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5 capitalize">
                          {member.role?.replace('-', ' ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Manage member roles if admin */}
                      {permissions.canManageMembers && !isPI && (
                        <select
                          value={member.role}
                          onChange={(e) => changeRoleMutation.mutate({ userId: userObj._id, role: e.target.value })}
                          className="bg-slate-50 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 outline-none"
                        >
                          <option value="project-admin">Project Admin</option>
                          <option value="research-collaborator">Collaborator</option>
                          <option value="research-assistant">Assistant</option>
                          <option value="read-only-member">Read Only</option>
                        </select>
                      )}

                      {/* Suspend / Remove buttons */}
                      {permissions.canManageMembers && !isPI && (
                        <>
                          <button
                            onClick={() => removeMutation.mutate(member._id)}
                            className="p-1 hover:bg-slate-50 text-slate-400 hover:text-red-500 rounded border border-slate-200"
                            title="Remove from Team"
                          >
                            <Trash size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Pending Invitations */}
        {permissions.canManageMembers && (
          <aside className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Pending Invitations ({invitations.length})</h4>

            {invitations.length === 0 ? (
              <p className="text-[10px] text-slate-400 font-semibold italic text-center py-4">No pending invites.</p>
            ) : (
              <div className="space-y-3">
                {invitations.map((inv) => (
                  <div key={inv._id} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[11px] font-bold text-slate-700">{inv.invitedUser?.fullName || inv.email}</p>
                        <p className="text-[9px] text-slate-400 uppercase font-bold mt-0.5">{inv.role?.replace('-', ' ')}</p>
                      </div>
                      <button
                        onClick={() => cancelInviteMutation.mutate(inv._id)}
                        className="text-[9px] font-bold text-red-650 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleInviteSubmit} className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-base text-slate-900">Invite Collaborator</h3>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">User ID / Email</label>
              <input
                required
                value={inviteForm.userId}
                onChange={(e) => setInviteForm({ ...inviteForm, userId: e.target.value })}
                placeholder="Enter collaborator's user ID or email"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none"
              />

              <label className="block text-xs font-semibold text-slate-700">Role Assignation</label>
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-650"
              >
                <option value="research-collaborator">Research Collaborator</option>
                <option value="research-assistant">Research Assistant</option>
                <option value="project-admin">Project Admin</option>
                <option value="reviewer">Peer Reviewer</option>
              </select>

              <label className="block text-xs font-semibold text-slate-700">Message (Optional)</label>
              <textarea
                value={inviteForm.message}
                onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                placeholder="Include a short message introducing the project..."
                rows="3"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-blue-650 text-white px-4 py-2 text-xs font-black shadow-md hover:bg-blue-700"
              >
                Send Invitation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
