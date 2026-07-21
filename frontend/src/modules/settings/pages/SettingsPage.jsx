import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Bell, Lock, Shield, Link2, AlertTriangle, Save } from 'lucide-react';
import GeneralSettings from '../components/GeneralSettings';
import NotificationSettings from '../components/NotificationSettings';
import PrivacySettings from '../components/PrivacySettings';
import SecuritySettings from '../components/SecuritySettings';
import ConnectedAccountsSettings from '../components/ConnectedAccountsSettings';
import DangerZoneSettings from '../components/DangerZoneSettings';

const SettingsPage = ({ profile, refetch, isOwnProfile }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [saveTrigger, setSaveTrigger] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mapUrlToId = (tabName) => {
    if (tabName === 'connected-accounts') return 'connected';
    if (tabName === 'danger-zone') return 'danger';
    return tabName;
  };

  const mapIdToUrl = (id) => {
    if (id === 'connected') return 'connected-accounts';
    if (id === 'danger') return 'danger-zone';
    return id;
  };

  const validTabIds = ['general', 'notifications', 'privacy', 'security', 'connected', 'danger'];
  const rawTab = searchParams.get('tab');
  const activeTab = validTabIds.includes(mapUrlToId(rawTab)) ? mapUrlToId(rawTab) : 'general';

  const setActiveTab = (tabId) => {
    setSearchParams({ tab: mapIdToUrl(tabId) });
  };

  const tabs = [
    { id: 'general', name: 'General', icon: User, component: GeneralSettings },
    { id: 'notifications', name: 'Notifications', icon: Bell, component: NotificationSettings },
    { id: 'privacy', name: 'Privacy', icon: Lock, component: PrivacySettings },
    { id: 'security', name: 'Security', icon: Shield, component: SecuritySettings },
    { id: 'connected', name: 'Connected Accounts', icon: Link2, component: ConnectedAccountsSettings },
    { id: 'danger', name: 'Danger Zone', icon: AlertTriangle, component: DangerZoneSettings }
  ];

  const activeTabItem = tabs.find((t) => t.id === activeTab);
  const ActiveComponent = activeTabItem ? activeTabItem.component : GeneralSettings;

  if (isOwnProfile === false) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-lg mx-auto space-y-4">
        <div className="p-4 bg-amber-50 text-accent-orange rounded-full w-fit mx-auto border border-amber-100">
          <Shield className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-text-primary tracking-tight font-display">Access Restricted</h3>
        <p className="text-xs text-text-secondary leading-relaxed font-semibold">
          You do not have permission to view or modify this researcher's account configuration settings.
        </p>
      </div>
    );
  }

  const handleHeaderSave = () => {
    if (saveTrigger) {
      saveTrigger();
    }
  };

  const showHeaderSave = activeTab === 'general';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-text-primary tracking-tight font-display">Settings</h1>
          <p className="text-xs font-semibold text-text-secondary">
            Manage your account preferences and visibility configurations.
          </p>
        </div>

        {showHeaderSave && (
          <button
            onClick={handleHeaderSave}
            disabled={isSubmitting}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white rounded-lg shadow-sm transition-all duration-200 active:scale-95 ${
              isSubmitting
                ? 'bg-primary/50 cursor-not-allowed'
                : 'bg-primary hover:bg-primary-hover shadow-primary/10'
            }`}
          >
            {isSubmitting ? (
              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Changes</span>
          </button>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Left Column (3 Columns wide) */}
        <div className="col-span-12 lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-2.5 lg:p-3 shadow-sm lg:sticky lg:top-[85px]">
          <div className="flex flex-wrap lg:flex-col gap-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 lg:gap-3 px-3 py-2 lg:px-4 lg:py-3 rounded-full lg:rounded-xl text-[11px] lg:text-xs font-extrabold transition-all duration-200 shrink-0 whitespace-nowrap ${
                    isSelected
                      ? 'bg-primary text-white shadow-sm shadow-blue-500/25'
                      : 'bg-slate-50 lg:bg-transparent text-slate-600 hover:text-primary hover:bg-slate-100 lg:hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 lg:w-4 lg:h-4 flex-shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column (9 Columns wide) */}
        <div className="col-span-12 lg:col-span-9">
          <ActiveComponent
            profile={profile}
            refetch={refetch}
            setSaveTrigger={setSaveTrigger}
            setIsSubmittingParent={setIsSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;