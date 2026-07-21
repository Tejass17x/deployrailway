import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Laptop, LogOut, Lock, AlertTriangle } from 'lucide-react';
import Input from '../../../components/common/inputs/Input';
import Button from '../../../components/common/buttons/Button';
import authService from '../../../services/auth.service';
import { useDispatch } from 'react-redux';
import { logoutSuccess } from '../../../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../../components/common/modals/ConfirmationModal';

const SecuritySettings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [logoutSubmitting, setLogoutSubmitting] = useState(false);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validatePasswordForm = () => {
    const errors = {};
    if (!passwords.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!passwords.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwords.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters long';
    }
    if (passwords.confirmPassword !== passwords.newPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) {
      toast.error('Please fix the password errors.');
      return;
    }

    setPasswordSubmitting(true);
    try {
      const response = await authService.changePassword(
        passwords.currentPassword,
        passwords.newPassword,
        passwords.confirmPassword
      );

      if (response && response.success) {
        toast.success('Password changed successfully!');
        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        throw new Error(response?.message || 'Password update failed.');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.message || (typeof err === 'string' ? err : err.error || 'An error occurred.');
      toast.error(errMsg);
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleLogoutCurrent = async () => {
    setLogoutSubmitting(true);
    try {
      const response = await authService.logout();
      if (response && response.success) {
        toast.success('Logged out successfully.');
        dispatch(logoutSuccess());
        navigate('/login');
      } else {
        throw new Error(response?.message || 'Logout failed.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Logout failed. Clearing local session...');
      dispatch(logoutSuccess());
      navigate('/login');
    } finally {
      setLogoutSubmitting(false);
    }
  };

  const [isConfirmLogoutAllOpen, setIsConfirmLogoutAllOpen] = useState(false);

  const performLogoutAll = async () => {
    setLogoutSubmitting(true);
    try {
      const response = await authService.logoutAll();
      if (response && response.success) {
        toast.success('Logged out of all sessions.');
        dispatch(logoutSuccess());
        navigate('/login');
      } else {
        throw new Error(response?.message || 'Logout-all failed.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Action failed. Clearing local session...');
      dispatch(logoutSuccess());
      navigate('/login');
    } finally {
      setLogoutSubmitting(false);
      setIsConfirmLogoutAllOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-5">
        <div>
          <h3 className="text-base font-black text-text-primary font-display">Change Password</h3>
          <p className="text-[11px] font-semibold text-text-secondary mt-1">
            Update your authentication account password credentials.
          </p>
        </div>

        <div className="border-t border-slate-100 -mx-6 md:-mx-8" />

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <Input
            label="Current Password"
            name="currentPassword"
            type="password"
            required
            value={passwords.currentPassword}
            onChange={handlePasswordChange}
            error={passwordErrors.currentPassword}
            disabled={passwordSubmitting}
            placeholder="••••••••"
            className="!space-y-1.5"
          />
          <Input
            label="New Password"
            name="newPassword"
            type="password"
            required
            value={passwords.newPassword}
            onChange={handlePasswordChange}
            error={passwordErrors.newPassword}
            disabled={passwordSubmitting}
            placeholder="••••••••"
            className="!space-y-1.5"
          />
          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            required
            value={passwords.confirmPassword}
            onChange={handlePasswordChange}
            error={passwordErrors.confirmPassword}
            disabled={passwordSubmitting}
            placeholder="••••••••"
            className="!space-y-1.5"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 mt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-text-secondary font-bold shrink-0">
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span>Ensure password credentials are secure.</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={passwordSubmitting}
              disabled={passwordSubmitting}
              className="w-full sm:w-auto px-5 py-2 font-bold text-xs bg-primary hover:bg-primary-hover shadow-sm"
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>

      {/* Session Devices Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-5">
        <div>
          <h3 className="text-base font-black text-text-primary font-display">Session Devices</h3>
          <p className="text-[11px] font-semibold text-text-secondary mt-1">
            Review active login sessions and verify connected clients.
          </p>
        </div>

        <div className="border-t border-slate-100 -mx-6 md:-mx-8" />

        {/* Current Active Session Row */}
        <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 text-slate-500 rounded-xl border border-slate-200/50 flex items-center justify-center shrink-0">
              <Laptop className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-xs font-bold text-text-primary">macOS (Chrome)</h4>
                <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wide">
                  Current Device
                </span>
              </div>
              <p className="text-[10px] text-text-secondary font-semibold">
                IP Address: ::1 • Location: Unknown
              </p>
              <p className="text-[9px] text-slate-400 font-bold">
                Logged in: 7/8/2026, 1:20:25 PM
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-3 pt-3">
          <button
            onClick={handleLogoutCurrent}
            disabled={logoutSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-white text-slate-700 border border-slate-250 hover:bg-slate-50 rounded-lg shadow-sm transition-all"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span>Logout Current Device</span>
          </button>
          
          <button
            disabled
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-slate-50 text-slate-450 border border-slate-200 rounded-lg cursor-not-allowed opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout Other Devices</span>
          </button>

          <button
            onClick={() => setIsConfirmLogoutAllOpen(true)}
            disabled={logoutSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-accent-red text-white hover:bg-red-650 rounded-lg shadow-sm transition-all sm:ml-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout All Devices</span>
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isConfirmLogoutAllOpen}
        onClose={() => setIsConfirmLogoutAllOpen(false)}
        onConfirm={performLogoutAll}
        title="Logout All Devices"
        description="Are you sure you want to terminate all active sessions? You will be logged out of this device too."
        confirmText="Logout All"
        cancelText="Cancel"
        variant="danger"
        loading={logoutSubmitting}
        icon={<AlertTriangle className="w-6 h-6 text-accent-red flex-shrink-0" />}
      />
    </div>
  );
};

export default SecuritySettings;
