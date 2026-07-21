import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Eye, ShieldCheck } from 'lucide-react';
import profileService from '../../../services/profile.service';

const ToggleSwitch = ({ label, description, checked, onChange, disabled }) => {
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
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-all duration-300 ${
          checked ? 'bg-primary' : 'bg-slate-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-all duration-300 ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

const PrivacySettings = ({ profile, refetch }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showEmail, setShowEmail] = useState(false);

  const [localPrefs, setLocalPrefs] = useState({
    publicProfile: true,
    showInstitution: true,
    showFollowers: true,
    searchEngineIndexing: true,
    researchVisibility: true,
  });

  useEffect(() => {
    if (profile) {
      setShowEmail(profile.emailVisibility === 'public');
      if (profile.privacySettings) {
        setLocalPrefs({
          publicProfile: profile.privacySettings.publicProfile !== false,
          showInstitution: profile.privacySettings.showInstitution !== false,
          showFollowers: profile.privacySettings.showFollowers !== false,
          searchEngineIndexing: profile.privacySettings.searchEngineIndexing !== false,
          researchVisibility: profile.privacySettings.researchVisibility !== false,
        });
      }
    }
  }, [profile]);

  const handleLocalChange = (key, value) => {
    setLocalPrefs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        emailVisibility: showEmail ? 'public' : 'private',
        privacySettings: localPrefs
      };

      const response = await profileService.updateProfile(payload);
      if (response && response.success) {
        toast.success('Privacy settings saved successfully!');
        if (refetch) await refetch();
      } else {
        throw new Error(response?.message || 'Failed to save privacy settings.');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.message || (typeof err === 'string' ? err : err.error || 'An error occurred while saving.');
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Visibility Settings */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Eye className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-black text-text-primary uppercase tracking-tight">Profile Visibility & Accessibility</h3>
        </div>

        <div className="divide-y divide-slate-100">
          <ToggleSwitch
            label="Public Profile"
            description="Make your research profile visible to everyone, including guests and search engines."
            checked={localPrefs.publicProfile}
            onChange={(val) => handleLocalChange('publicProfile', val)}
            disabled={isSubmitting}
          />
          <ToggleSwitch
            label="Show Email"
            description="Display your primary verified institutional email address on your public profile page."
            checked={showEmail}
            onChange={(val) => setShowEmail(val)}
            disabled={isSubmitting}
          />
          <ToggleSwitch
            label="Show Institution"
            description="Display your current academic institution and department details publicly."
            checked={localPrefs.showInstitution}
            onChange={(val) => handleLocalChange('showInstitution', val)}
            disabled={isSubmitting}
          />
          <ToggleSwitch
            label="Show Followers"
            description="Allow other users and site visitors to see your list of followers and researchers you follow."
            checked={localPrefs.showFollowers}
            onChange={(val) => handleLocalChange('showFollowers', val)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Indexing Settings */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-black text-text-primary uppercase tracking-tight">Discovery & Search Settings</h3>
        </div>

        <div className="divide-y divide-slate-100">
          <ToggleSwitch
            label="Search Engine Indexing"
            description="Allow external crawler bots (like Google Scholar or Bing) to index your profile pages."
            checked={localPrefs.searchEngineIndexing}
            onChange={(val) => handleLocalChange('searchEngineIndexing', val)}
            disabled={isSubmitting}
          />
          <ToggleSwitch
            label="Research Visibility"
            description="Make your publications, projects, and datasets viewable by non-logged-in guest users."
            checked={localPrefs.researchVisibility}
            onChange={(val) => handleLocalChange('researchVisibility', val)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end">
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-6 py-2.5 font-bold text-xs text-white bg-primary hover:bg-primary-hover rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          Save Privacy Settings
        </button>
      </div>
    </div>
  );
};

export default PrivacySettings;
