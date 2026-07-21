import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Smartphone, 
  Laptop, 
  History, 
  LogOut, 
  Globe, 
  Trash2, 
  CheckCircle, 
  AlertTriangle,
  Edit2,
  Check,
  X,
  Calendar,
  Clock
} from 'lucide-react';
import api from '../../services/api';
import Button from '@/components/common/Button.jsx';

const SecuritySettings = () => {
  const [sessions, setSessions] = useState([]);
  const [loginActivity, setLoginActivity] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Renaming state
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Fetch all security data
  const fetchSecurityData = async () => {
    try {
      setIsLoading(true);
      
      const [sessionsRes, activityRes, logsRes] = await Promise.all([
        api.get('/auth/trusted-devices'),
        api.get('/auth/login-activity'),
        api.get('/auth/security-logs')
      ]);

      setSessions(sessionsRes.data?.sessions || sessionsRes.data?.devices || []);
      setLoginActivity(activityRes.data?.activity || []);
      setSecurityLogs(logsRes.data?.logs || []);
    } catch (err) {
      showMsg('error', 'Failed to load security settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  // Terminate a device session (Revoke)
  const handleTerminateSession = async (sessionId) => {
    setActionLoadingId(sessionId);
    try {
      const res = await api.delete(`/auth/trusted-devices/${sessionId}`);
      
      // If user terminated their current session, they will be logged out automatically by the API redirect
      if (res.data?.isCurrent) {
        showMsg('success', 'Current session revoked. Logging you out...');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
        }, 1500);
        return;
      }
      
      setSessions(prev => prev.filter(s => s._id !== sessionId));
      showMsg('success', 'Device session revoked successfully.');
      
      // Refresh logs
      const logsRes = await api.get('/auth/security-logs');
      setSecurityLogs(logsRes.data?.logs || []);
    } catch (err) {
      showMsg('error', 'Failed to revoke device session.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Terminate all sessions
  const handleTerminateAllSessions = async () => {
    setActionLoadingId('all');
    try {
      await api.post('/auth/logout-all');
      showMsg('success', 'Successfully logged out of all devices.');
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }, 1500);
    } catch (err) {
      showMsg('error', 'Failed to terminate all sessions.');
      setActionLoadingId(null);
    }
  };

  // Start renaming session
  const startRename = (session) => {
    setEditingId(session._id);
    setEditingName(session.deviceName);
  };

  // Cancel renaming session
  const cancelRename = () => {
    setEditingId(null);
    setEditingName('');
  };

  // Save device name
  const saveRename = async (sessionId) => {
    if (!editingName.trim()) return;
    setActionLoadingId(sessionId);
    try {
      await api.patch(`/auth/trusted-devices/${sessionId}`, { deviceName: editingName });
      
      setSessions(prev => prev.map(s => {
        if (s._id === sessionId) {
          return { ...s, deviceName: editingName.trim() };
        }
        return s;
      }));
      
      showMsg('success', 'Device renamed successfully.');
      setEditingId(null);
    } catch (err) {
      showMsg('error', 'Failed to rename device.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400">Loading security configurations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 text-left">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 font-display flex items-center gap-2">
          <Shield className="w-7 h-7 text-blue-600" /> Security & Trusted Devices
        </h2>
        <p className="text-xs text-slate-500 mt-1">Manage your active, trusted devices and view security logs.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 animate-slide-in ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* 1. Active Sessions / Trusted Devices */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Laptop className="w-5 h-5 text-blue-600" /> Trusted Devices & Sessions
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">These devices are authorized to access your account without OTP requirements.</p>
          </div>
          {sessions.length > 1 && (
            <Button 
              variant="danger" 
              size="sm" 
              onClick={handleTerminateAllSessions}
              isLoading={actionLoadingId === 'all'}
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign Out All Devices
            </Button>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {sessions.map((session) => (
            <div key={session._id} className="py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 first:pt-0 last:pb-0">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0 shadow-sm">
                  {session.os && (session.os.toLowerCase().includes('windows') || session.os.toLowerCase().includes('mac')) ? (
                    <Laptop className="w-5.5 h-5.5 text-slate-600" />
                  ) : (
                    <Smartphone className="w-5.5 h-5.5 text-slate-600" />
                  )}
                </div>
                
                <div className="space-y-1">
                  {editingId === session._id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="px-2.5 py-1 text-xs border border-slate-300 focus:border-blue-500 rounded-lg focus:outline-none bg-slate-50"
                        placeholder="Device name"
                        autoFocus
                      />
                      <button
                        onClick={() => saveRename(session._id)}
                        disabled={actionLoadingId === session._id}
                        className="p-1 text-green-600 hover:bg-green-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={cancelRename}
                        className="p-1 text-slate-400 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-slate-800 flex flex-wrap items-center gap-2">
                      <span>{session.deviceName}</span>
                      <button
                        onClick={() => startRename(session)}
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                        title="Rename device"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      
                      {session.isCurrent && (
                        <span className="text-[10px] bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded-full border border-green-100 flex items-center gap-1 shadow-sm">
                          <CheckCircle className="w-2.5 h-2.5 text-green-600" /> Current Device
                        </span>
                      )}
                      
                      {session.isTrusted && (
                        <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-100 shadow-sm">
                          Trusted Device
                        </span>
                      )}
                    </p>
                  )}
                  
                  <p className="text-xs text-slate-500 font-medium">
                    {session.browser} on {session.os}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-slate-400" /> {session.ipAddress}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" /> First Login: {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> Last Active: {new Date(session.lastActive).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTerminateSession(session._id)}
                  disabled={actionLoadingId === session._id}
                  className="flex items-center gap-1.5 !text-slate-500 hover:!text-red-600 hover:!bg-red-50 !border-slate-200 hover:!border-red-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{session.isCurrent ? 'Log Out' : 'Sign Out Device'}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Login History & Security Audit Logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        {/* Login History */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <History className="w-4.5 h-4.5 text-blue-600" /> Recent Logins
          </h3>
          <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
            {loginActivity.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No recent login activity.</p>
            ) : (
              loginActivity.map((act) => (
                <div key={act._id} className="text-xs flex items-start justify-between gap-2 border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-700">{act.browser} on {act.os}</p>
                    <p className="text-[10px] text-slate-400">{act.ipAddress} • {new Date(act.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    act.status === 'success' 
                      ? 'bg-green-50 text-green-700 border border-green-100' 
                      : 'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                    {act.status === 'success' ? 'Success' : 'Failed'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Security Logs */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="w-4.5 h-4.5 text-blue-600" /> Security Events
          </h3>
          <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
            {securityLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No security events logged.</p>
            ) : (
              securityLogs.map((log) => (
                <div key={log._id} className="text-xs space-y-0.5 border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-700 capitalize">
                      {log.action.replace(/_/g, ' ')}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">IP: {log.ipAddress}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
