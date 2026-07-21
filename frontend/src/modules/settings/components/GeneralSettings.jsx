import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, X } from 'lucide-react';
import Input from '../../../components/common/inputs/Input';
import profileService from '../../../services/profile.service';
import { useDispatch } from 'react-redux';
import { updateProfileState, updateUserState } from '../../../redux/slices/authSlice';

const GeneralSettings = ({ profile, refetch, setSaveTrigger, setIsSubmittingParent }) => {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });

  const [interests, setInterests] = useState([]);
  const [newInterest, setNewInterest] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize fields with profile data
  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        email: profile.email || '',
      });

      if (profile.researchAreas) {
        setInterests(profile.researchAreas.map(area => typeof area === 'string' ? area : area.name));
      }
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  // Add a new research interest pill
  const handleAddInterest = (e) => {
    e.preventDefault();
    const cleanTag = newInterest.trim();
    if (!cleanTag) return;

    if (interests.some((tag) => tag.toLowerCase() === cleanTag.toLowerCase())) {
      toast.error('This research interest is already added.');
      return;
    }

    setInterests([...interests, cleanTag]);
    setNewInterest('');
  };

  // Remove a research interest pill
  const handleRemoveInterest = (tagToRemove) => {
    setInterests(interests.filter((tag) => tag !== tagToRemove));
  };

  // Basic Validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain alphanumeric characters, hyphens, and underscores';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form.');
      return;
    }

    setIsSubmitting(true);
    setIsSubmittingParent(true);

    try {
      const payload = {
        username: formData.username,
        researchAreas: interests,
      };

      const response = await profileService.updateProfile(payload);
      
      if (response && response.success) {
        const updatedProfile = response.data;
        if (updatedProfile) {
          dispatch(updateProfileState(updatedProfile));
          dispatch(updateUserState({
            username: updatedProfile.username,
            profileSlug: updatedProfile.profileSlug,
            firstName: updatedProfile.firstName,
            lastName: updatedProfile.lastName,
          }));
        }

        toast.success('Profile information updated successfully!');
        if (refetch) await refetch();
      } else {
        throw new Error(response?.message || 'Failed to save changes.');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.message || (typeof err === 'string' ? err : err.error || 'An error occurred while saving.');
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
      setIsSubmittingParent(false);
    }
  };

  // Bind the save action to the parent header trigger
  useEffect(() => {
    if (setSaveTrigger) {
      setSaveTrigger(() => () => {
        handleSave();
      });
    }
    return () => {
      if (setSaveTrigger) setSaveTrigger(null);
    };
  }, [formData, interests, setSaveTrigger]);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      {/* Card Header */}
      <div>
        <h3 className="text-base font-black text-text-primary font-display">Account Information</h3>
        <p className="text-[11px] font-semibold text-text-secondary mt-1">
          Manage your username and research interests.
        </p>
      </div>

      {/* Edge-to-edge Horizontal Line */}
      <div className="border-t border-slate-100 -mx-6 md:-mx-8" />

      {/* Form Fields */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
        <div className="space-y-1.5">
          <Input
            label="Username"
            name="username"
            required
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
            disabled={isSubmitting}
            placeholder="pawan-agrahari"
            className="!space-y-1.5"
          />
          <p className="text-[10.5px] text-text-secondary font-medium leading-relaxed">
            Used in your public profile link. Changing it will break any previously shared links.
          </p>
        </div>

        <Input
          label="Primary Email"
          name="email"
          type="email"
          value={formData.email}
          disabled
          placeholder="agrahari511@gmail.com"
          className="opacity-75 cursor-not-allowed !space-y-1.5"
        />

        {/* Research Interests tag manager */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-semibold text-text-secondary tracking-wide flex items-center gap-1">
            Research Interests
          </label>
          <div className="flex gap-2">
            <Input
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              placeholder="e.g. Machine Learning, NLP..."
              disabled={isSubmitting}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddInterest(e);
                }
              }}
              className="!space-y-0"
            />
            <button
              type="button"
              onClick={handleAddInterest}
              disabled={isSubmitting}
              className="px-3 bg-slate-55 border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all rounded-lg shrink-0 flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {interests.map((interest, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-xl font-semibold text-text-primary"
              >
                {interest}
                <button
                  type="button"
                  onClick={() => handleRemoveInterest(interest)}
                  className="hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {interests.length === 0 && (
              <p className="text-xs text-text-secondary italic">No research interests added yet.</p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default GeneralSettings;