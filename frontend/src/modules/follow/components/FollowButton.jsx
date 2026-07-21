import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { UserPlus, UserCheck, AlertTriangle } from 'lucide-react';
import followService from '../services/follow.service';

const FollowButton = ({ targetUserId, username, className = '' }) => {
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch follow status
  const { data: statusData, isLoading } = useQuery({
    queryKey: ['followStatus', targetUserId],
    queryFn: async () => {
      const res = await followService.getFollowStatus(targetUserId);
      return res.data;
    },
    enabled: !!targetUserId
  });

  const isFollowing = statusData?.isFollowing;

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      return await followService.followUser(targetUserId);
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Successfully followed researcher!');
        invalidateQueries();
      }
    }
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      return await followService.unfollowUser(targetUserId);
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Successfully unfollowed researcher.');
        invalidateQueries();
      }
    }
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['followStatus', targetUserId] });
    if (username) {
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
      queryClient.invalidateQueries({ queryKey: ['followers', username] });
      queryClient.invalidateQueries({ queryKey: ['following', username] });
    }
    queryClient.invalidateQueries({ queryKey: ['suggestions'] });
  };

  const handleAction = () => {
    if (isFollowing) {
      setShowConfirm(true);
    } else {
      followMutation.mutate();
    }
  };

  const confirmUnfollow = () => {
    unfollowMutation.mutate();
    setShowConfirm(false);
  };

  if (isLoading) {
    return (
      <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold animate-pulse">
        Loading...
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handleAction}
        disabled={followMutation.isPending || unfollowMutation.isPending}
        className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 duration-200 cursor-pointer ${
          isFollowing
            ? 'border border-[#E2E8F0] bg-white text-[#475569] hover:bg-red-50 hover:text-red-650 hover:border-red-200'
            : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm shadow-[#2563EB]/10'
        } ${className}`}
      >
        {isFollowing ? (
          <>
            <UserCheck className="w-3.5 h-3.5" />
            <span>Following</span>
          </>
        ) : (
          <>
            <UserPlus className="w-3.5 h-3.5" />
            <span>Follow</span>
          </>
        )}
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs z-[999] p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-amber-500">
              <div className="p-2 bg-amber-50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Unfollow Researcher?</h3>
            </div>
            <p className="text-xs text-[#475569] leading-relaxed font-semibold">
              Are you sure you want to stop following this researcher? You will stop seeing their academic activity in your feed.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-[#475569] rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnfollow}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                Unfollow
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FollowButton;
