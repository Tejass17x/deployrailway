import React, { useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCheck, Trash2, BellOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import notificationsService from '../services/notifications.service';
import { formatTimeAgo } from '../../../hooks/useNotifications';

const NotificationDropdown = ({ onClose }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  // Fetch latest 20 notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', { limit: 20 }],
    queryFn: async () => {
      const res = await notificationsService.getNotifications({ limit: 20 });
      return res.data;
    }
  });

  const notifications = notificationsData?.docs || [];

  // Mark all read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return await notificationsService.markAllRead();
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success('All notifications marked as read.');
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      }
    }
  });

  // Mark single read mutation
  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      return await notificationsService.markAsRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    }
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await notificationsService.deleteNotification(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    }
  });

  const handleItemClick = (n) => {
    if (!n.isRead) {
      markReadMutation.mutate(n._id);
    }
    if (n.targetUrl) {
      navigate(n.targetUrl);
    }
    onClose();
  };

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    markAllReadMutation.mutate();
  };

  return (
    <div 
      ref={dropdownRef}
      className="fixed sm:absolute left-2 right-2 top-[70px] sm:left-auto sm:right-0 sm:top-auto sm:mt-3 w-auto sm:w-96 bg-white border border-slate-200/60 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-[100] overflow-hidden text-left flex flex-col max-h-[80vh] sm:max-h-[480px] animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5 origin-top sm:origin-top-right"
    >
      {/* Header */}
      <div className="relative flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-slate-50">
        <div>
          <h4 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">Notifications</h4>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Your latest updates</p>
        </div>
        
        {notifications.some(n => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}
            className="group flex items-center gap-1.5 text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 border border-blue-100 px-2.5 py-1.5 rounded-lg transition-all duration-300 cursor-pointer shadow-sm hover:shadow active:scale-95"
          >
            <CheckCheck className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100/50 custom-scrollbar">
        {isLoading ? (
          <div className="py-12 text-center text-xs font-semibold text-slate-400 animate-pulse flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Loading updates...
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => (
            <div 
              key={n._id}
              onClick={() => handleItemClick(n)}
              className={`p-4 flex items-start gap-3.5 hover:bg-slate-50/80 transition-all duration-200 cursor-pointer relative group ${
                !n.isRead ? 'bg-blue-50/30' : ''
              }`}
            >
              {/* Unread indicator glow */}
              {!n.isRead && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              )}

              {/* Avatar */}
              <div className="relative shrink-0">
                <img
                  src={(typeof n.actorId?.profileImage === 'string' ? n.actorId?.profileImage : n.actorId?.profileImage?.url) || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"}
                  alt={n.actorId?.firstName || 'User'}
                  className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-white"
                />
                {!n.isRead && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full" />
                )}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0 pr-6">
                <p className="text-[12px] font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                  {n.title}
                </p>
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed mt-0.5 line-clamp-2">
                  {n.message}
                </p>
                <span className="text-[9px] font-bold text-slate-400 block mt-1.5 uppercase tracking-wider">
                  {formatTimeAgo(n.createdAt)}
                </span>
              </div>

              {/* Delete trigger */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMutation.mutate(n._id);
                }}
                className="absolute right-3 top-4 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all duration-200"
                title="Dismiss"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="py-16 text-center text-slate-400 space-y-3 px-6">
            <div className="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center">
              <BellOff className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-600">All caught up!</p>
            <p className="text-[10px] text-slate-400 font-medium">You have no new notifications right now.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <Link 
        to="/notifications" 
        onClick={onClose}
        className="block text-center py-3.5 bg-slate-50 border-t border-slate-100 text-[11px] font-black uppercase text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 transition-colors tracking-wider"
      >
        <span>View all notifications</span>
      </Link>
    </div>
  );
};

export default NotificationDropdown;