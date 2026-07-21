import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Bell, ShieldAlert, Mail } from 'lucide-react';
import notificationsService from '../../notifications/services/notifications.service';

const SUPPORTED_KEYS = [
  'publication',
  'comment',
  'connection',
  'follow',
  'mention',
  'system',
  'emailAlerts',
  'weeklyDigest',
  'newMessages'
];

const ToggleSwitch = ({ label, description, checked, onChange, disabled, isSupported = true }) => {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0 last:pb-0">
      <div className="space-y-0.5 max-w-[80%]">
        <label className="text-xs font-bold text-text-primary">{label}</label>
        {description && (
          <p className="text-[10px] text-text-secondary font-semibold leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        disabled={disabled || !isSupported}
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-all duration-300 ${
          checked && isSupported ? 'bg-primary' : 'bg-slate-200'
        } ${(disabled || !isSupported) ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-all duration-300 ${
            checked && isSupported ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

const NotificationSettings = ({ profile, refetch }) => {
  const [updatingKeys, setUpdatingKeys] = useState({});

  const [backendPrefs, setBackendPrefs] = useState({
    publication: true,
    comment: true,
    connection: true,
    follow: true,
    mention: true,
    system: true,
  });

  const [localPrefs, setLocalPrefs] = useState({
    emailAlerts: true,
    weeklyDigest: true,
    newMessages: true,
  });

  useEffect(() => {
    if (profile?.notificationSettings) {
      const ns = profile.notificationSettings;
      setBackendPrefs({
        publication: ns.publication !== false,
        comment: ns.comment !== false,
        connection: ns.connection !== false,
        follow: ns.follow !== false,
        mention: ns.mention !== false,
        system: ns.system !== false,
      });
      setLocalPrefs({
        emailAlerts: ns.emailAlerts !== false,
        weeklyDigest: ns.weeklyDigest !== false,
        newMessages: ns.newMessages !== false,
      });
    }
  }, [profile]);

  const handleToggleChange = async (key, isLocal, value) => {
    if (!SUPPORTED_KEYS.includes(key)) {
      return;
    }

    if (updatingKeys[key]) return;

    const prevValue = isLocal ? localPrefs[key] : backendPrefs[key];

    setUpdatingKeys((prev) => ({ ...prev, [key]: true }));

    let nextBackendPrefs = { ...backendPrefs };
    let nextLocalPrefs = { ...localPrefs };

    if (isLocal) {
      nextLocalPrefs[key] = value;
      setLocalPrefs(nextLocalPrefs);
    } else {
      nextBackendPrefs[key] = value;
      setBackendPrefs(nextBackendPrefs);
    }

    try {
      const mergedPayload = {
        ...nextBackendPrefs,
        ...nextLocalPrefs,
      };

      const response = await notificationsService.updateSettings(mergedPayload);
      if (response && response.success) {
        toast.success('Notification preferences updated successfully!');
        
        if (response.data) {
          const ns = response.data;
          setBackendPrefs({
            publication: ns.publication !== false,
            comment: ns.comment !== false,
            connection: ns.connection !== false,
            follow: ns.follow !== false,
            mention: ns.mention !== false,
            system: ns.system !== false,
          });
          setLocalPrefs({
            emailAlerts: ns.emailAlerts !== false,
            weeklyDigest: ns.weeklyDigest !== false,
            newMessages: ns.newMessages !== false,
          });
        } else {
          if (refetch) await refetch();
        }
      } else {
        throw new Error(response?.message || 'Failed to update preferences.');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.message || (typeof err === 'string' ? err : err.error || 'An error occurred.');
      toast.error(errMsg);
      
      if (isLocal) {
        setLocalPrefs((prev) => ({ ...prev, [key]: prevValue }));
      } else {
        setBackendPrefs((prev) => ({ ...prev, [key]: prevValue }));
      }
    } finally {
      setUpdatingKeys((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Research Updates */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-black text-text-primary uppercase tracking-tight">Research Updates</h3>
        </div>

        <div className="divide-y divide-slate-100">
          <ToggleSwitch
            label="Publication updates"
            description="Get notified when co-authors publish new articles or when publications matching your interests are uploaded."
            checked={backendPrefs.publication}
            onChange={(val) => handleToggleChange('publication', false, val)}
            disabled={!!updatingKeys['publication']}
            isSupported={SUPPORTED_KEYS.includes('publication')}
          />
          <ToggleSwitch
            label="Citation alerts"
            description="Receive real-time alerts when one of your publications gets cited by other research publications."
            checked={backendPrefs.comment}
            onChange={(val) => handleToggleChange('comment', false, val)}
            disabled={!!updatingKeys['comment']}
            isSupported={SUPPORTED_KEYS.includes('comment')}
          />
          <ToggleSwitch
            label="Collaboration requests"
            description="Get notified when other researchers send you connection or collaboration workspace requests."
            checked={backendPrefs.connection}
            onChange={(val) => handleToggleChange('connection', false, val)}
            disabled={!!updatingKeys['connection']}
            isSupported={SUPPORTED_KEYS.includes('connection')}
          />
        </div>
      </div>

      {/* Communication Preferences */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Mail className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-black text-text-primary uppercase tracking-tight">Communication Channels</h3>
        </div>

        <div className="divide-y divide-slate-100">
          <ToggleSwitch
            label="Email notifications"
            description="Send core updates, citation summaries, and network invitation requests directly to your primary email."
            checked={localPrefs.emailAlerts}
            onChange={(val) => handleToggleChange('emailAlerts', true, val)}
            disabled={!!updatingKeys['emailAlerts']}
            isSupported={SUPPORTED_KEYS.includes('emailAlerts')}
          />
          <ToggleSwitch
            label="Push notifications"
            description="Receive in-browser alerts and real-time alerts when you are active on the portal."
            checked={backendPrefs.system}
            onChange={(val) => handleToggleChange('system', false, val)}
            disabled={!!updatingKeys['system']}
            isSupported={SUPPORTED_KEYS.includes('system')}
          />
          <ToggleSwitch
            label="Weekly digest"
            description="Receive a weekly curated newsletter highlighting top developments in your research interest areas."
            checked={localPrefs.weeklyDigest}
            onChange={(val) => handleToggleChange('weeklyDigest', true, val)}
            disabled={!!updatingKeys['weeklyDigest']}
            isSupported={SUPPORTED_KEYS.includes('weeklyDigest')}
          />
        </div>
      </div>

      {/* Activity Updates */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <ShieldAlert className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-black text-text-primary uppercase tracking-tight">Activity Preferences</h3>
        </div>

        <div className="divide-y divide-slate-100">
          <ToggleSwitch
            label="New followers"
            description="Get notified when other researchers start following your academic profile page."
            checked={backendPrefs.follow}
            onChange={(val) => handleToggleChange('follow', false, val)}
            disabled={!!updatingKeys['follow']}
            isSupported={SUPPORTED_KEYS.includes('follow')}
          />
          <ToggleSwitch
            label="New messages"
            description="Receive notifications when you get personal chat or group collaboration messages."
            checked={localPrefs.newMessages}
            onChange={(val) => handleToggleChange('newMessages', true, val)}
            disabled={!!updatingKeys['newMessages']}
            isSupported={SUPPORTED_KEYS.includes('newMessages')}
          />
          <ToggleSwitch
            label="Mentions"
            description="Receive notifications when another scholar mentions your name or citations in comment boards."
            checked={backendPrefs.mention}
            onChange={(val) => handleToggleChange('mention', false, val)}
            disabled={!!updatingKeys['mention']}
            isSupported={SUPPORTED_KEYS.includes('mention')}
          />
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;

