import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Share2, Lock, RefreshCw, Check, ShieldCheck, Mail, KeyRound, Sparkles } from 'lucide-react';
import authService from '../../../services/auth.service';
import { setCredentials, setOtpEmail } from '../../../redux/slices/authSlice';
import Button from '../../../components/common/buttons/Button';

/* ---------------------------------------------------------
   Small presentational helpers (pure UI, no data/logic risk)
--------------------------------------------------------- */

// Decorative "secure verification" graphic: a shield with orbiting particles
const ShieldGraphic = () => {
  const orbitDots = [0, 1, 2, 3, 4];
  return (
    <svg viewBox="0 0 320 320" className="w-full h-full" aria-hidden="true">
      {/* outer pulse rings */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={`ring-${i}`}
          cx="160"
          cy="160"
          r="70"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.5"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: [1, 1.9, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 3.2, repeat: Infinity, delay: i * 1, ease: 'easeInOut' }}
        />
      ))}

      {/* orbit path + traveling dots */}
      <circle cx="160" cy="160" r="110" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="2 6" />
      {orbitDots.map((i) => (
        <motion.circle
          key={`orbit-${i}`}
          r={i % 2 === 0 ? 4 : 3}
          fill="#FFFFFF"
          animate={{
            cx: [
              160 + 110 * Math.cos((i * (2 * Math.PI)) / orbitDots.length),
              160 + 110 * Math.cos((i * (2 * Math.PI)) / orbitDots.length + 2 * Math.PI)
            ],
            cy: [
              160 + 110 * Math.sin((i * (2 * Math.PI)) / orbitDots.length),
              160 + 110 * Math.sin((i * (2 * Math.PI)) / orbitDots.length + 2 * Math.PI)
            ]
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
          opacity={0.8}
        />
      ))}

      {/* shield body */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
      >
        <path
          d="M160 90 L206 108 V158 C206 190 186 214 160 224 C134 214 114 190 114 158 V108 Z"
          fill="rgba(255,255,255,0.15)"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <motion.path
          d="M138 160 L153 175 L184 142"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
        />
      </motion.g>
    </svg>
  );
};

const FloatingBadge = ({ icon, className, delay = 0, duration = 5 }) => (
  <motion.div
    className={`absolute rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 p-2.5 text-white shadow-lg ${className}`}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: [0, -10, 0] }}
    transition={{
      opacity: { duration: 0.6, delay },
      y: { duration, repeat: Infinity, ease: 'easeInOut', delay }
    }}
  >
    {icon}
  </motion.div>
);

const otpBoxVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.9 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, delay: 0.15 + i * 0.06, type: 'spring' }
  })
};

/* ---------------------------------------------------------
   OtpVerificationPage
--------------------------------------------------------- */

const OtpVerificationPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { otpEmail, otpPurpose } = useSelector((state) => state.auth);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [shake, setShake] = useState(false);

  const inputRefs = useRef([]);

  // Redirect if no email is loaded in state
  useEffect(() => {
    if (!otpEmail) {
      toast.error('Session expired. Please restart registration or login.');
      navigate('/login');
    }
  }, [otpEmail, navigate]);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    // Only accept numeric inputs
    if (value && isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); // Get last char
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];

      // If current input is empty, clear previous and focus it
      if (!otp[index] && index > 0) {
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1].focus();
      } else {
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (pasteData.length === 6 && !isNaN(pasteData)) {
      const pasteArray = pasteData.split('');
      setOtp(pasteArray);
      inputRefs.current[5].focus();
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // Submit OTP
  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length < 6) {
      toast.error('Please enter the complete 6-digit code.');
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      let response;
      const purpose = otpPurpose || 'login';

      if (purpose === 'registration') {
        try {
          response = await authService.verifyRegistrationOtp(otpEmail, otpCode);
        } catch (err) {
          // If registration verify fails, try login verify as fallback just in case
          const code = err?.error?.code;
          if (code === 'INVALID_OTP' || code === 'NOT_FOUND' || err?.statusCode === 404) {
            response = await authService.verifyLoginOtp(otpEmail, otpCode);
          } else {
            throw err;
          }
        }
      } else {
        try {
          response = await authService.verifyLoginOtp(otpEmail, otpCode);
        } catch (err) {
          // If login verify fails, try registration verify as fallback
          const code = err?.error?.code;
          if (code === 'EMAIL_NOT_VERIFIED' || code === 'INVALID_OTP' || code === 'NOT_FOUND' || err?.statusCode === 404) {
            response = await authService.verifyRegistrationOtp(otpEmail, otpCode);
          } else {
            throw err;
          }
        }
      }

      if (response && response.success) {
        toast.success(response.message || 'Verification successful!');
        dispatch(setCredentials(response.data));

        // Redirect based on whether user was pending (registration completion redirect to success page)
        // Or if it was simple login redirect to dashboard
        if (purpose === 'registration' || response.message?.toLowerCase().includes('registration') || response.message?.toLowerCase().includes('verified')) {
          navigate('/success');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('OTP verify error:', error);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      if (otpPurpose === 'registration') {
        await authService.sendRegistrationOtp(otpEmail);
      } else {
        await authService.sendLoginOtp(otpEmail);
      }
      toast.success('A new 6-digit verification code has been sent to your email.');
      setResendCooldown(60); // Reset timer
    } catch (error) {
      console.error('Resend OTP error:', error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    /*
      AuthLayout wraps every auth route in a centered `max-w-md` box.
      `fixed inset-0` lets this page paint over the full viewport with its
      own split layout without needing any change to AuthLayout or the
      other auth pages.
    */
    <div className="fixed inset-0 z-10 w-full h-full flex bg-bg-page overflow-y-auto">
      {/* ambient background accents */}
      <div className="pointer-events-none fixed -top-24 -right-24 w-96 h-96 rounded-full bg-light-purple blur-3xl opacity-60" />
      <div className="pointer-events-none fixed -bottom-32 -left-16 w-96 h-96 rounded-full bg-light-blue blur-3xl opacity-70" />

      {/* -------------------- LEFT: security-themed hero -------------------- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary to-accent-indigo overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)',
            backgroundSize: '22px 22px'
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center opacity-90">
          <div className="w-[380px] h-[380px]">
            <ShieldGraphic />
          </div>
        </div>

        <FloatingBadge icon={<Mail className="w-5 h-5" />} className="top-[16%] left-[12%]" delay={0.6} duration={5.5} />
        <FloatingBadge icon={<KeyRound className="w-5 h-5" />} className="top-[66%] left-[10%]" delay={1.1} duration={4.5} />
        <FloatingBadge icon={<ShieldCheck className="w-5 h-5" />} className="top-[18%] right-[10%]" delay={0.9} duration={6} />

        <div className="relative z-10 flex flex-col justify-between h-full w-full p-12 text-white">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-white/15 backdrop-blur-sm border border-white/25">
              <Share2 className="w-5 h-5" />
            </span>
            <span className="font-extrabold text-lg tracking-tight">
              Research<span className="text-white/80">Connect</span>
            </span>
          </div>

          <div className="max-w-sm">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/15 border border-white/25 rounded-full px-3 py-1 mb-4 backdrop-blur-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Secure verification
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-3xl font-bold leading-tight tracking-tight"
            >
              One step closer to your workspace.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-sm text-white/80 mt-3 leading-relaxed"
            >
              We use one-time codes to keep your papers, data, and
              collaborations safe from unauthorized access.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-2 text-sm text-white/85">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              Two-factor protected sign-in
            </div>
            <div className="flex items-center gap-2 text-sm text-white/85">
              <Lock className="w-4 h-4 flex-shrink-0" />
              End-to-end encrypted in transit
            </div>
            <div className="flex items-center gap-2 text-sm text-white/85">
              <Mail className="w-4 h-4 flex-shrink-0" />
              Codes expire automatically for your safety
            </div>
          </motion.div>
        </div>
      </div>

      {/* -------------------- RIGHT: OTP form -------------------- */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card w-full max-w-md rounded-2xl p-8 shadow-xl border border-border bg-white bg-opacity-70 backdrop-blur-md text-center"
        >
          <div className="flex flex-col items-center mb-6">
            <motion.span
              initial={{ scale: 0.6, rotate: -15, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="p-3 rounded-full bg-light-blue text-primary flex items-center justify-center mb-4"
            >
              <Lock className="w-6 h-6" />
            </motion.span>
            <h2 className="text-xl font-bold text-text-primary tracking-tight">Email Verification</h2>
            <p className="text-sm text-text-secondary mt-1">
              We sent a 6-digit code to <br />
              <strong className="text-text-primary">{otpEmail}</strong>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            {/* OTP Inputs */}
            <motion.div
              className="flex justify-between gap-2 max-w-sm mx-auto"
              onPaste={handlePaste}
              animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : { x: 0 }}
              transition={{ duration: 0.45 }}
            >
              {otp.map((digit, idx) => (
                <motion.input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  custom={idx}
                  variants={otpBoxVariants}
                  initial="hidden"
                  animate="show"
                  className={`w-12 h-14 text-center text-xl font-bold bg-bg-card border rounded-xl focus:outline-none transition-all shadow-sm ${
                    digit
                      ? 'border-primary ring-2 ring-primary ring-opacity-30 scale-105'
                      : 'border-border focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-40'
                  }`}
                />
              ))}
            </motion.div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 font-semibold text-sm shadow-md relative overflow-hidden group"
              loading={loading}
              icon={<Check className="w-4 h-4" />}
            >
              <span className="relative z-10">Verify Account</span>
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
              />
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border flex flex-col items-center gap-3">
            <p className="text-xs text-text-secondary">Didn't receive the email code?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isResending}
              className={`flex items-center gap-2 text-xs font-bold transition-colors ${
                resendCooldown > 0
                  ? 'text-text-secondary cursor-not-allowed'
                  : 'text-primary hover:text-primary-hover'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
              {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code Now'}
            </button>

            {resendCooldown > 0 && (
              <div className="w-32 h-1 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-1000 ease-linear"
                  style={{ width: `${(resendCooldown / 60) * 100}%` }}
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OtpVerificationPage;
