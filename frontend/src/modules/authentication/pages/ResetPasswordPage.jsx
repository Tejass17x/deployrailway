import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Lock, KeyRound, ArrowLeft, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, X } from 'lucide-react';
import authService from '../../../services/auth.service';
import { setOtpEmail } from '../../../redux/slices/authSlice';
import Input from '../../../components/common/inputs/Input';
import Button from '../../../components/common/buttons/Button';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, when: 'beforeChildren', staggerChildren: 0.08 }
  }
};

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } }
};

const shakeVariants = {
  idle: { x: 0 },
  shake: { x: [0, -8, 8, -6, 6, -3, 3, 0], transition: { duration: 0.4 } }
};

const RESEND_COOLDOWN = 30;

const getPasswordStrength = (password) => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  return score;
};

const strengthMeta = [
  { label: 'Too weak', color: 'bg-red-400' },
  { label: 'Weak', color: 'bg-orange-400' },
  { label: 'Fair', color: 'bg-yellow-400' },
  { label: 'Good', color: 'bg-lime-500' },
  { label: 'Strong', color: 'bg-green-500' }
];

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { otpEmail } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [shake, setShake] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);
  const [resultModal, setResultModal] = useState(null);

  useEffect(() => {
    if (!otpEmail && !resultModal) {
      toast.error('Session expired. Please restart the forgot password request.');
      navigate('/forgot-password');
    }
  }, [otpEmail, navigate, resultModal]);

  useEffect(() => {
    document.getElementById('otp-box-0')?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const maskedEmail = otpEmail?.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => `${a}${'*'.repeat(b.length)}${c}`);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      otp: '',
      password: '',
      confirmPassword: ''
    }
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');
  const strength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword && password === confirmPassword;

  useEffect(() => {
    register('otp', {
      required: 'Verification code is required',
      minLength: { value: 6, message: 'OTP must be exactly 6 digits' }
    });
  }, [register]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value.slice(-1);
    setOtpDigits(next);
    setValue('otp', next.join(''), { shouldValidate: true });

    if (value && index < 5) {
      document.getElementById(`otp-box-${index + 1}`)?.focus();
    }

    if (next.every((d) => d !== '') && navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      document.getElementById(`otp-box-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = pasted.split('');
    while (next.length < 6) next.push('');
    setOtpDigits(next);
    setValue('otp', next.join(''), { shouldValidate: true });
    document.getElementById(`otp-box-${Math.min(pasted.length, 5)}`)?.focus();
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await authService.resetPassword(
        otpEmail,
        data.otp,
        data.password,
        data.confirmPassword
      );

      if (response.success) {
        setResultModal({ type: 'success', message: 'Your password has been reset successfully!' });
      }
    } catch (error) {
      console.error('Password reset failed:', error);
      setShake(true);
      if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
      setTimeout(() => setShake(false), 400);
      setResultModal({
        type: 'error',
        message: error?.response?.data?.message || 'Something went wrong. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    try {
      await authService.forgotPassword(otpEmail);
      toast.success('A new code has been sent to your email.');
      setResendCooldown(RESEND_COOLDOWN);
      setOtpDigits(['', '', '', '', '', '']);
      setValue('otp', '');
      document.getElementById('otp-box-0')?.focus();
    } catch (error) {
      console.error('Resend OTP failed:', error);
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="glass-card w-full rounded-xl sm:rounded-2xl p-5 sm:p-8 shadow-xl border border-border bg-white bg-opacity-70 backdrop-blur-md relative overflow-hidden"
    >
      <motion.div variants={shakeVariants} animate={shake ? 'shake' : 'idle'} className="contents">
      <motion.div
        className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-gradient-primary opacity-10 blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div variants={fieldVariants} className="flex flex-col items-center mb-6 text-center relative">
        <Link to="/" className="flex items-center gap-2 mb-4">
          <motion.span
            whileHover={{ rotate: 12, scale: 1.08 }}
            className="p-2 rounded-lg bg-gradient-primary text-white flex items-center justify-center"
          >
            <Share2 className="w-5 h-5" />
          </motion.span>
          <span className="font-bold text-xl tracking-tight text-text-primary">
            Research<span className="text-primary">Connect</span>
          </span>
        </Link>

        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
          className="p-3 rounded-full bg-primary/10 text-primary mb-3"
        >
          <ShieldCheck className="w-6 h-6" />
        </motion.div>

        <h2 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">Set New Password</h2>
        <p className="text-[11px] sm:text-xs text-text-secondary mt-1 px-4">
          For email <strong className="text-text-primary">{maskedEmail}</strong>
        </p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <motion.div variants={fieldVariants}>
          <label className="block text-xs font-semibold text-text-secondary mb-2">
            Verification Code (OTP)
          </label>
          <div className="flex justify-between gap-1.5 sm:gap-2" onPaste={handleOtpPaste}>
            {otpDigits.map((digit, i) => (
              <motion.input
                key={i}
                id={`otp-box-${i}`}
                whileFocus={{ scale: 1.08 }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className={`w-10 h-12 sm:w-11 sm:h-12 text-center text-lg font-semibold rounded-lg border bg-white/80 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30 ${
                  errors.otp ? 'border-red-400' : 'border-border'
                }`}
              />
            ))}
          </div>
          <AnimatePresence>
            {errors.otp && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-red-500 mt-1.5 flex items-center gap-1"
              >
                <KeyRound className="w-3 h-3" /> {errors.otp.message}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex justify-center mt-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resending}
              className="text-[11px] font-semibold text-primary disabled:text-text-secondary disabled:cursor-not-allowed hover:underline transition-colors"
            >
              {resending
                ? 'Sending...'
                : resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : 'Resend code'}
            </button>
          </div>
        </motion.div>

        <motion.div variants={fieldVariants} className="relative">
          <Input
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            error={errors.password?.message}
            required
            {...register('password', {
              required: 'New password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters long' }
            })}
            icon={<Lock className="w-4 h-4 text-text-secondary" />}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-[26px] p-2 text-text-secondary hover:text-text-primary transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {password && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2"
              >
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        i < strength ? strengthMeta[strength].color : 'bg-gray-200'
                      }`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: i * 0.05 }}
                      style={{ transformOrigin: 'left' }}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-text-secondary mt-1">{strengthMeta[strength].label}</p>
                <ul className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                  {[
                    { label: '6+ characters', met: password.length >= 6 },
                    { label: 'Upper & lower case', met: /[A-Z]/.test(password) && /[a-z]/.test(password) },
                    { label: 'Number & symbol', met: /\d/.test(password) && /[^A-Za-z0-9]/.test(password) }
                  ].map((req) => (
                    <motion.li
                      key={req.label}
                      animate={{ color: req.met ? 'rgb(22 163 74)' : 'rgb(148 163 184)' }}
                      className="flex items-center gap-1 text-[10px] font-medium"
                    >
                      <CheckCircle2 className={`w-3 h-3 ${req.met ? 'opacity-100' : 'opacity-40'}`} />
                      {req.label}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={fieldVariants} className="relative">
          <Input
            label="Confirm New Password"
            type={showConfirm ? 'text' : 'password'}
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            required
            {...register('confirmPassword', {
              required: 'Confirm password is required',
              validate: (value) => value === getValues('password') || 'Passwords do not match'
            })}
            icon={<Lock className="w-4 h-4 text-text-secondary" />}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-2 top-[26px] p-2 text-text-secondary hover:text-text-primary transition-colors"
            tabIndex={-1}
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {passwordsMatch && !errors.confirmPassword && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[11px] text-green-600 mt-1.5 flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          variants={fieldVariants}
          whileHover={{ scale: otpDigits.join('').length === 6 ? 1.01 : 1 }}
          whileTap={{ scale: otpDigits.join('').length === 6 ? 0.98 : 1 }}
          className="sticky bottom-0 pb-[env(safe-area-inset-bottom)] sm:static bg-gradient-to-t from-white via-white/95 to-transparent sm:bg-none pt-3 sm:pt-0 -mx-5 sm:mx-0 px-5 sm:px-0"
        >
          <Button
            type="submit"
            variant="primary"
            className="w-full py-2.5 font-semibold text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            loading={loading}
            disabled={otpDigits.join('').length !== 6}
          >
            Reset Password
          </Button>
        </motion.div>
      </form>

      <motion.div
        variants={fieldVariants}
        className="mt-8 pt-6 border-t border-border flex items-center justify-center"
      >
        <Link
          to="/forgot-password"
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Request New Code
        </Link>
      </motion.div>
      </motion.div>

      <AnimatePresence>
        {resultModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl relative text-center"
            >
              {resultModal.type === 'error' && (
                <button
                  onClick={() => setResultModal(null)}
                  className="absolute right-3 top-3 p-1.5 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 ${
                  resultModal.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                }`}
              >
                {resultModal.type === 'success' ? (
                  <CheckCircle2 className="w-7 h-7" />
                ) : (
                  <AlertCircle className="w-7 h-7" />
                )}
              </motion.div>

              <h3 className="text-lg font-bold text-text-primary mb-1.5">
                {resultModal.type === 'success' ? 'Password Reset!' : 'Reset Failed'}
              </h3>
              <p className="text-sm text-text-secondary mb-6">{resultModal.message}</p>

              {resultModal.type === 'success' ? (
                <Button
                  type="button"
                  variant="primary"
                  className="w-full py-2.5 font-semibold text-sm"
                  onClick={() => {
                    dispatch(setOtpEmail(null));
                    navigate('/login');
                  }}
                >
                  Go to Login
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  className="w-full py-2.5 font-semibold text-sm"
                  onClick={() => setResultModal(null)}
                >
                  Try Again
                </Button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ResetPasswordPage;