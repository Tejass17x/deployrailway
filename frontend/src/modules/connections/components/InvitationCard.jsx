import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { GraduationCap, Check, X, Send } from 'lucide-react';
import connectionsService from '../services/connections.service';
import UserAvatar from '../../../components/ui/Avatar';

const InvitationCard = ({ request, type = 'received', currentUserId }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Accept mutation
  const acceptMutation = useMutation({
    mutationFn: async () => {
      return await connectionsService.acceptConnectionRequest(request._id);
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success(`You are now connected with ${otherUser.fullName}`);
        queryClient.invalidateQueries({ queryKey: ['connectionRequests'] });
        queryClient.invalidateQueries({ queryKey: ['connections'] });
        queryClient.invalidateQueries({ queryKey: ['connectionStatus'] });
      }
    }
  });

  // Reject/Ignore mutation
  const rejectMutation = useMutation({
    mutationFn: async () => {
      return await connectionsService.rejectConnectionRequest(request._id);
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Connection request ignored.');
        queryClient.invalidateQueries({ queryKey: ['connectionRequests'] });
      }
    }
  });

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: async () => {
      return await connectionsService.withdrawConnectionRequest(request._id);
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Connection request withdrawn.');
        queryClient.invalidateQueries({ queryKey: ['connectionRequests'] });
        queryClient.invalidateQueries({ queryKey: ['connectionStatus'] });
      }
    }
  });

  const otherUser = type === 'received' ? request.user : request.user;
  const profile = type === 'received' ? request.profile : request.profile;

  if (!otherUser) return null;

  const handleCardClick = () => {
    navigate(`/profile/${otherUser.profileSlug || otherUser.username}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 text-left">
      <div className="flex gap-4 items-start">
        {/* Avatar */}
        <div className="cursor-pointer shrink-0" onClick={handleCardClick}>
          <UserAvatar user={otherUser} size="lg" showBorder />
        </div>

        {/* User details */}
        <div className="space-y-1 min-w-0 flex-1">
          <h4 
            onClick={handleCardClick}
            className="text-sm font-black text-[#0F172A] hover:text-[#2563EB] cursor-pointer transition-colors leading-tight truncate"
          >
            {otherUser.fullName}
          </h4>

          {profile?.headline && (
            <p className="text-[11px] font-semibold text-[#475569] leading-snug line-clamp-2">
              {profile.headline}
            </p>
          )}

          {profile?.institution && (
            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{profile.institution}</span>
            </p>
          )}
        </div>
      </div>

      {/* Note segment */}
      {request.note && (
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-[#475569] font-medium leading-relaxed italic relative">
          <p className="line-clamp-3">"{request.note}"</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1 gap-2">
        <span className="text-[9px] font-black uppercase text-slate-400">
          {type === 'received' ? 'Received request' : 'Sent request'}
        </span>

        <div className="flex gap-1.5">
          {type === 'received' ? (
            <>
              <button
                onClick={() => rejectMutation.mutate()}
                disabled={rejectMutation.isPending || acceptMutation.isPending}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-55 hover:bg-slate-100 text-[#475569] rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border border-slate-200"
              >
                <X className="w-3.5 h-3.5" />
                <span>Ignore</span>
              </button>
              
              <button
                onClick={() => acceptMutation.mutate()}
                disabled={rejectMutation.isPending || acceptMutation.isPending}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => withdrawMutation.mutate()}
              disabled={withdrawMutation.isPending}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border border-red-100"
            >
              <X className="w-3.5 h-3.5" />
              <span>Withdraw</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvitationCard;
