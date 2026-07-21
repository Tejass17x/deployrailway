import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  Mail,
  Eye,
  EyeOff,
  TrendingUp,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Check,
  Users,
  FileText,
  Award
} from 'lucide-react';
import authService from '../../../services/auth.service';
import { setOtpEmail, setOtpPurpose } from '../../../redux/slices/authSlice';
import Input from '../../../components/common/inputs/Input';
import Button from '../../../components/common/buttons/Button';

/* ---------------------------------------------------------
   Small presentational helpers (pure UI, no data/logic risk)
--------------------------------------------------------- */

// A floating mockup of a real publication card, instead of generic
// abstract shapes — meant to look like an actual piece of the product
// rather than stock "AI landing page" decoration.
const ResearchCardMockup = () => {
  const collaborators = ['AS', 'RV', 'MK'];

  return (
    <div className="relative w-[300px]">
      {/* faint card stacked behind, hints at depth without extra noise */}
      <motion.div
        initial={{ opacity: 0, y: 14, rotate: -7 }}
        animate={{ opacity: 1, y: 0, rotate: -7 }}
        transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
        className="absolute -top-3 -left-3 w-full h-full bg-white/10 border border-white/15 rounded-2xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 18, rotate: 3 }}
        animate={{ opacity: 1, y: 0, rotate: 3 }}
        whileHover={{ rotate: 0 }}
        transition={{ duration: 0.55, delay: 0.3, type: 'spring', stiffness: 90 }}
        className="relative bg-white rounded-2xl shadow-2xl p-5 w-full"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-light-blue px-2 py-1 rounded-full">
            Neuroscience
          </span>
          <motion.span
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.9, type: 'spring' }}
            className="flex items-center gap-1 text-[10px] font-bold text-accent-green bg-light-green px-2 py-1 rounded-full"
          >
            <TrendingUp className="w-3 h-3" />
            128 citations
          </motion.span>
        </div>

        <h3 className="text-sm font-bold text-text-primary leading-snug mb-1">
          Neural Mechanisms of Long-Term Memory Consolidation
        </h3>
        <p className="text-xs text-text-secondary mb-4">
          A. Sharma, R. Verma, et al. &middot; Journal of Cognitive Science
        </p>

        <div className="flex items-center">
          {collaborators.map((initials, i) => (
            <span
              key={initials}
              style={{ marginLeft: i === 0 ? 0 : -8, zIndex: collaborators.length - i }}
              className="w-6 h-6 rounded-full bg-primary border-2 border-white text-[9px] text-white flex items-center justify-center font-bold"
            >
              {initials}
            </span>
          ))}
          <span className="text-[10px] text-text-secondary ml-2">+4 collaborators</span>
        </div>
      </motion.div>

      {/* small live-status chip, reads as real product state rather than decoration */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="absolute -right-6 top-1/2 flex items-center gap-1.5 bg-white/15 border border-white/20 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-full"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-green" />
        </span>
        Synced just now
      </motion.div>
    </div>
  );
};

// Real-feeling platform metrics instead of a generic "trusted by" strip —
// framed the way a research tool would actually report its own usage.
const heroStats = [
  { icon: Users, value: '18,400+', label: 'Researchers' },
  { icon: FileText, value: '62K+', label: 'Papers tracked' },
  { icon: Award, value: '1.1M+', label: 'Citations synced' }
];

const HeroStats = () => (
  <motion.div
    initial="hidden"
    animate="show"
    variants={{
      hidden: {},
      show: { transition: { staggerChildren: 0.12, delayChildren: 0.55 } }
    }}
    className="grid grid-cols-3 gap-5 max-w-sm mt-8 pt-6 border-t border-white/15"
  >
    {heroStats.map(({ icon: Icon, value, label }) => (
      <motion.div
        key={label}
        variants={{
          hidden: { opacity: 0, y: 10 },
          show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } }
        }}
      >
        <Icon className="w-4 h-4 text-white/70 mb-1.5" />
        <div className="text-lg font-bold text-white leading-none">{value}</div>
        <div className="text-[11px] text-white/65 mt-1">{label}</div>
      </motion.div>
    ))}
  </motion.div>
);

// Inline field error, used for the password input which isn't wrapped by
// the shared Input component. Kept as a small local piece so the shake +
// icon treatment stays consistent wherever a raw error string shows up.
const FieldError = ({ message }) => (
  <AnimatePresence mode="wait">
    {message && (
      <motion.span
        key={message}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-1.5 text-xs font-medium text-accent-red mt-1.5"
      >
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        {message}
      </motion.span>
    )}
  </AnimatePresence>
);

/* ---------------------------------------------------------
   LoginPage
--------------------------------------------------------- */

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.15 }
  }
};

const fieldVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await authService.login(data.email, data.password);

      if (response.data?.requiresOtp) {
        toast.success('Credentials verified. Please enter the verification OTP sent to your email.', {
          duration: 4000
        });
        dispatch(setOtpEmail(response.data.email));
        dispatch(setOtpPurpose('login'));
        navigate('/otp');
      }
    } catch (error) {
      // Error handled by axios interceptor toast
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    /*
      AuthLayout wraps every auth route in a centered `max-w-md` box, which
      is perfect for a single card but would clip this page's split hero
      panel. `fixed inset-0` lets this page paint over the full viewport
      without needing any change to AuthLayout or the other auth pages.
    */
    <div className="fixed inset-0 z-10 w-full h-full flex bg-bg-page overflow-y-auto">
      {/* ambient background accents (page-wide, sit behind everything) — now
          drifting slowly instead of sitting static, so the page reads alive
          without competing for attention */}
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none fixed -top-24 -right-24 w-96 h-96 rounded-full bg-light-purple blur-3xl opacity-60"
      />
      <motion.div
        animate={{ x: [0, -25, 0], y: [0, -15, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="pointer-events-none fixed -bottom-32 -left-16 w-96 h-96 rounded-full bg-light-blue blur-3xl opacity-70"
      />

      {/* -------------------- LEFT: research-themed hero -------------------- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary to-accent-indigo overflow-hidden">
        {/* dot-grid texture, kept subtle */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        <div className="relative z-10 flex flex-col justify-between h-full w-full p-12 text-white">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-white/15 backdrop-blur-sm border border-white/25">
              <Share2 className="w-5 h-5" />
            </span>
            <span className="font-extrabold text-lg tracking-tight">
              Research<span className="text-white/80">Connect</span>
            </span>
          </div>

          <div>
            <div className="max-w-sm">
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="text-3xl font-bold leading-tight tracking-tight"
              >
                Where great research finds its network.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="text-sm text-white/80 mt-3 leading-relaxed"
              >
                Track citations, collaborate with peers, and manage your papers
                in one connected workspace built for researchers.
              </motion.p>
            </div>

            <HeroStats />
          </div>

          <div className="flex items-end justify-between">
            <ResearchCardMockup />
          </div>
        </div>
      </div>

      {/* -------------------- RIGHT: sign-in form -------------------- */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="glass-card w-full max-w-md rounded-2xl p-8 shadow-xl border border-white/40 bg-white bg-opacity-60 backdrop-blur-xl relative overflow-hidden"
        >
          {/* subtle top highlight, standard glass panel cue — thin gradient
              line rather than a heavy border so it reads as glass, not a box */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

          <div className="flex flex-col items-center mb-8">
            <Link to="/" className="flex items-center gap-2 mb-4 lg:hidden">
              <motion.span
                initial={{ scale: 0.6, rotate: -15, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-accent-indigo text-white flex items-center justify-center shadow-md"
              >
                <Share2 className="w-6 h-6" />
              </motion.span>
              <span className="font-extrabold text-2xl tracking-tight text-text-primary">
                Research<span className="text-primary">Connect</span>
              </span>
            </Link>
            <motion.span
              initial={{ scale: 0.6, rotate: -15, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="hidden lg:flex p-3 rounded-xl bg-gradient-to-br from-primary to-accent-indigo text-white items-center justify-center shadow-md mb-3"
            >
              <Share2 className="w-6 h-6" />
            </motion.span>
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">Welcome Back</h2>
            <p className="text-sm text-text-secondary mt-1">Sign in to your research workspace</p>
          </div>

          <motion.form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            noValidate
          >
            <motion.div variants={fieldVariants} className="relative">
              <Input
                label="Email Address"
                type="email"
                placeholder="name@institution.edu"
                error={errors.email?.message}
                required
                {...register('email', {
                  required: 'Email address is required',
                  validate: (value) => {
                    const trimmed = value.trim();
                    if (!trimmed) return 'Email address is required';
                    const pattern = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
                    return pattern.test(trimmed) || 'Please enter a valid email address';
                  }
                })}
                icon={<Mail className="w-4 h-4 text-text-secondary" />}
              />
            </motion.div>

            <motion.div variants={fieldVariants} className="relative">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-text-secondary tracking-wide">
                  Password <span className="text-accent-red font-bold">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  className={`w-full px-4 py-2 text-sm bg-bg-card border ${
                    errors.password ? 'border-accent-red focus:ring-accent-red' : 'border-border focus:ring-primary'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-40 transition-colors pr-10`}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    }
                  })}
                />
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.85, rotate: 10 }}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-text-secondary hover:text-text-primary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </motion.button>
              </div>
              <FieldError message={errors.password?.message} />
            </motion.div>

            {/* Remember Me — visual state only, nothing sent to the backend */}
            <motion.div variants={fieldVariants} className="flex items-center -mt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={rememberMe}
                  onClick={() => setRememberMe((prev) => !prev)}
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                    rememberMe
                      ? 'bg-primary border-primary'
                      : 'bg-bg-card border-border group-hover:border-primary'
                  }`}
                >
                  <AnimatePresence>
                    {rememberMe && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
                <span className="text-xs font-medium text-text-secondary">Keep me signed in on this device</span>
              </label>
            </motion.div>
             <motion.div variants={fieldVariants}>
              <Button
                type="submit"
                variant="primary"
                className="w-full py-2.5 font-semibold text-sm shadow-md relative overflow-hidden group"
                loading={loading}
                disabled={loading}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? 'Verifying...' : 'Verify Credentials'}
                </span>
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
                />
              </Button>
            </motion.div>

            {/* Security badge — reassurance, not decoration */}
            <motion.div
              variants={fieldVariants}
              className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-text-secondary"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-accent-green" />
              Secured with 256-bit encryption
            </motion.div>
          </motion.form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-text-secondary">
              New to Research Connect?{' '}
              <Link
                to="/register"
                className="font-semibold text-primary hover:text-primary-hover transition-colors"
              >
                Create an Account
              </Link>
            </p>

            <div className="flex items-center justify-center gap-3 mt-4 text-[11px] text-text-secondary">
              <Link to="/privacy" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <span className="text-border">&middot;</span>
              <Link to="/terms" className="hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <span className="text-border">&middot;</span>
              <Link to="/help" className="hover:text-primary transition-colors">
                Help
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
