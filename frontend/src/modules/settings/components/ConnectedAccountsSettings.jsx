import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Linkedin, Globe } from 'lucide-react';
import profileService from '../../../services/profile.service';

const OrcidIcon = () => (
  <svg viewBox="0 0 256 256" className="w-5 h-5 flex-shrink-0">
    <circle cx="128" cy="128" r="120" fill="#A6CE39" />
    <path d="M120.2 73.1c0 6.6-5.4 12-12 12s-12-5.4-12-12 5.4-12 12-12 12 5.4 12 12zm-22.3 22.8h20.6v95.2H97.9V95.9zm41.2 0h32.2c25.4 0 40.5 15.6 40.5 37.6 0 25-17.3 40.3-43.2 40.3h-29.5V95.9zm20.6 60.5h10c14.2 0 21.8-8.7 21.8-22.8 0-14-7.6-20.9-21.8-20.9h-10v43.7z" fill="#FFFFFF" />
  </svg>
);

const ScholarIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-500" fill="currentColor">
    <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
    <path d="M12 18.5c-3.1 0-6-1.5-6-4.5h2c0 2 2.1 2.5 4 2.5s4-.5 4-2.5h2c0 3-2.9 4.5-6 4.5z" />
  </svg>
);

const ConnectedAccountsSettings = ({ profile, refetch }) => {
  const [socialLinks, setSocialLinks] = useState({
    orcid: '',
    googleScholar: '',
    linkedin: '',
    website: '',
  });

  const [inputVisible, setInputVisible] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync socialLinks from profile details
  useEffect(() => {
    if (profile?.socialLinks) {
      setSocialLinks({
        orcid: profile.socialLinks.orcid || '',
        googleScholar: profile.socialLinks.googleScholar || '',
        linkedin: profile.socialLinks.linkedin || '',
        website: profile.socialLinks.website || '',
      });
    }
  }, [profile]);

  const updateAccountLink = async (field, value) => {
    setIsSaving(true);
    try {
      const updatedSocial = {
        ...socialLinks,
        [field]: value,
      };

      const response = await profileService.updateProfile({
        socialLinks: updatedSocial,
      });

      if (response && response.success) {
        toast.success(value ? 'Account connected successfully!' : 'Account disconnected successfully.');
        setInputVisible(null);
        setInputValue('');
        if (refetch) await refetch();
      } else {
        throw new Error(response?.message || 'Failed to update link.');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.message || (typeof err === 'string' ? err : err.error || 'An error occurred.');
      toast.error(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectClick = (field, currentVal) => {
    setInputValue(currentVal);
    setInputVisible(field);
  };

  const handleDisconnectClick = (field) => {
    if (window.confirm(`Are you sure you want to disconnect this account?`)) {
      updateAccountLink(field, '');
    }
  };

  const accounts = [
    {
      id: 'orcid',
      name: 'ORCID',
      description: 'Connect your ORCID iD to sync your research publication history automatically.',
      icon: OrcidIcon,
      connected: !!socialLinks.orcid,
      displayId: socialLinks.orcid,
      placeholder: 'Enter ORCID ID (e.g. 0000-0002-1825-0097)',
    },
    {
      id: 'googleScholar',
      name: 'Google Scholar',
      description: 'Associate your Google Scholar profile to display citation metrics and publication counts.',
      icon: ScholarIcon,
      connected: !!socialLinks.googleScholar,
      displayId: socialLinks.googleScholar,
      placeholder: 'Enter Google Scholar URL',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      description: 'Sync your professional profile to display academic history and job experiences.',
      icon: () => <Linkedin className="w-5 h-5 text-blue-600" />,
      connected: !!socialLinks.linkedin,
      displayId: socialLinks.linkedin,
      placeholder: 'Enter LinkedIn Profile URL',
    },
    {
      id: 'website',
      name: 'Personal Website',
      description: 'Display your official lab, institution page, or personal developer landing page URL.',
      icon: () => <Globe className="w-5 h-5 text-teal-555" />,
      connected: !!socialLinks.website,
      displayId: socialLinks.website,
      placeholder: 'Enter Website URL (e.g. https://janedoe.com)',
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-black text-text-primary font-display">Connected Accounts</h3>
        <p className="text-[11px] font-semibold text-text-secondary mt-1">
          Manage secure external service integrations and web presence profile linkages.
        </p>
      </div>

      <div className="border-t border-slate-100 -mx-6 md:-mx-8" />

      {/* Account Items List */}
      <div className="divide-y divide-slate-100">
        {accounts.map((acc) => {
          const IconComponent = acc.icon;
          const isInputActive = inputVisible === acc.id;

          return (
            <div key={acc.id} className="py-5 first:pt-0 last:pb-0 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    <IconComponent />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xs font-black text-text-primary uppercase tracking-tight">{acc.name}</h4>
                      
                      {acc.connected ? (
                        <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wide">
                          Connected
                        </span>
                      ) : (
                        <span className="text-[9px] bg-slate-50 text-slate-400 border border-slate-200 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wide">
                          Not Connected
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-text-secondary font-semibold leading-relaxed max-w-xl">
                      {acc.description}
                    </p>
                    {acc.connected && acc.displayId && (
                      <p className="text-[10px] text-primary font-bold truncate max-w-[240px] sm:max-w-xs md:max-w-md mt-1">
                        {acc.displayId.startsWith('http') ? (
                          <a href={acc.displayId} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {acc.displayId}
                          </a>
                        ) : (
                          <a href={acc.id === 'orcid' ? `https://orcid.org/${acc.displayId}` : '#'} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {acc.displayId}
                          </a>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 pl-9 sm:pl-0">
                  {acc.connected ? (
                    <button
                      onClick={() => handleDisconnectClick(acc.id)}
                      disabled={isSaving}
                      className="w-full sm:w-auto px-4 py-1.5 text-xs font-bold bg-white text-slate-700 border border-slate-250 hover:bg-slate-50 rounded-lg shadow-sm transition-all"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnectClick(acc.id, acc.displayId || '')}
                      disabled={isSaving}
                      className="w-full sm:w-auto px-5 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-sm shadow-primary/10 transition-all"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>

              {isInputActive && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pl-0 sm:pl-9 max-w-md animate-fade-in">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={acc.placeholder}
                    className="flex-grow min-w-0 px-3 py-1.5 text-xs bg-white border border-slate-205 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-text-primary"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateAccountLink(acc.id, inputValue)}
                      disabled={isSaving}
                      className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold text-white bg-primary rounded-lg shrink-0"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setInputVisible(null)}
                      className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold bg-white text-slate-700 border border-slate-250 rounded-lg shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConnectedAccountsSettings;