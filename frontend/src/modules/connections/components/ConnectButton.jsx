import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { UserPlus, UserCheck, ChevronDown, Trash2, XCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import connectionsService from '../services/connections.service';
import ConnectionModal from './ConnectionModal';

const ConnectButton = ({ targetUserId, username, className = '' }) => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Fetch connection status
  const { data: statusData, isLoading } = useQuery({
    queryKey: ['connectionStatus', targetUserId],
    queryFn: async () => {
      const res = await connectionsService.getConnectionStatus(targetUserId);
      return res.data;
    },
    enabled: !!targetUserId
  });

  const connectionStatus = statusData?.status || 'none'; // none, pending_sent, pending_received, connected
  const requestId = statusData?.requestId;
  const connectionId = statusData?.connectionId;

  // Invalidate query cache after updates
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['connectionStatus', targetUserId] });
    if (username) {
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    }
    // NetworkPage keeps its own separate caches (suggestions/requests/tab
    // list/overview). Without invalidating these too, withdrawing/removing/
    // accepting here leaves stale "Pending"/"Connected" state on the Network
    // tab until a hard refresh, since those queries never get marked stale.
    queryClient.invalidateQueries({ queryKey: ['networkSuggestions'] });
    queryClient.invalidateQueries({ queryKey: ['networkTabList'] });
    queryClient.invalidateQueries({ queryKey: ['networkRequests'] });
    queryClient.invalidateQueries({ queryKey: ['networkOverview'] });
  };

  // Send request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async (note) => {
      return await connectionsService.sendConnectionRequest(targetUserId, note);
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Connection request sent!');
        setModalOpen(false);
        invalidateQueries();
      }
    }
  });

  // Accept request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async () => {
      return await connectionsService.acceptConnectionRequest(requestId);
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Connection request accepted! You are now connected.');
        invalidateQueries();
      }
    }
  });

  // Withdraw request mutation
  const withdrawRequestMutation = useMutation({
    mutationFn: async () => {
      return await connectionsService.withdrawConnectionRequest(requestId);
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Connection request withdrawn.');
        invalidateQueries();
      }
    }
  });

  // Remove connection mutation
  const removeConnectionMutation = useMutation({
    mutationFn: async () => {
      return await connectionsService.removeConnection(connectionId);
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Connection removed.');
        setShowRemoveConfirm(false);
        invalidateQueries();
      }
    }
  });

  const handleAction = () => {
    if (connectionStatus === 'none') {
      setModalOpen(true);
    } else if (connectionStatus === 'pending_received') {
      acceptRequestMutation.mutate();
    } else {
      setDropdownOpen(!dropdownOpen);
    }
  };

  const handleWithdraw = () => {
    setDropdownOpen(false);
    withdrawRequestMutation.mutate();
  };

  const handleRemove = () => {
    setDropdownOpen(false);
    setShowRemoveConfirm(true);
  };

  if (isLoading) {
    return (
      <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold animate-pulse">
        Loading...
      </button>
    );
  }

  // Render different states
  let buttonContent = null;
  let buttonClass = '';

  if (connectionStatus === 'none') {
    buttonContent = (
      <>
        <UserPlus className="w-3.5 h-3.5" />
        <span>Connect</span>
      </>
    );
    buttonClass = 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm shadow-[#2563EB]/15';
  } else if (connectionStatus === 'pending_sent') {
    buttonContent = (
      <>
        <span>Pending</span>
        <ChevronDown className="w-3 h-3 opacity-80" />
      </>
    );
    buttonClass = 'border border-slate-200 bg-slate-50 text-[#475569] hover:bg-slate-100';
  } else if (connectionStatus === 'pending_received') {
    buttonContent = (
      <>
        <CheckCircle className="w-3.5 h-3.5" />
        <span>Accept Request</span>
      </>
    );
    buttonClass = 'bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-sm shadow-green-600/10';
  } else if (connectionStatus === 'connected') {
    buttonContent = (
      <>
        <UserCheck className="w-3.5 h-3.5 text-blue-650" />
        <span className="text-blue-650">Connected</span>
        <ChevronDown className="w-3 h-3 text-blue-650 opacity-80" />
      </>
    );
    buttonClass = 'border border-blue-200 bg-blue-50/50 hover:bg-blue-50';
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={handleAction}
        disabled={
          sendRequestMutation.isPending || 
          acceptRequestMutation.isPending || 
          withdrawRequestMutation.isPending || 
          removeConnectionMutation.isPending
        }
        className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 duration-200 cursor-pointer ${buttonClass} ${className}`}
      >
        {buttonContent}
      </button>

      {/* Dropdown for Pending Sent or Connected */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-left text-xs font-semibold text-[#475569]">
          {connectionStatus === 'pending_sent' && (
            <button
              onClick={handleWithdraw}
              className="w-full px-4 py-2 hover:bg-red-50 text-red-650 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Withdraw Request</span>
            </button>
          )}

          {connectionStatus === 'connected' && (
            <button
              onClick={handleRemove}
              className="w-full px-4 py-2 hover:bg-red-50 text-red-650 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Connection</span>
            </button>
          )}
        </div>
      )}

      {/* Send Request Modal */}
      <ConnectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={(note) => sendRequestMutation.mutate(note)}
        isPending={sendRequestMutation.isPending}
      />

      {/* Remove Connection Confirmation Dialog */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs z-[999] p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-2 bg-red-50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Remove Connection?</h3>
            </div>
            <p className="text-xs text-[#475569] leading-relaxed font-semibold">
              This researcher will no longer appear in your connections list. You will need to send a new connection request to reconnect.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowRemoveConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#475569] rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => removeConnectionMutation.mutate()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectButton;