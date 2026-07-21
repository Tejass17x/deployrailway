import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, GraduationCap, Building2, HeartPulse, UserCheck, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import authService from '../../../services/auth.service';
import { setOtpEmail, setOtpPurpose } from '../../../redux/slices/authSlice';
import Input from '../../../components/common/inputs/Input';
import Select from '../../../components/common/inputs/Select';
import Checkbox from '../../../components/common/inputs/Checkbox';
import Button from '../../../components/common/buttons/Button';

const countriesList = [
  { value: 'United States', label: 'United States' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Australia', label: 'Australia' },
  { value: 'India', label: 'India' },
  { value: 'Brazil', label: 'Brazil' },
  { value: 'Japan', label: 'Japan' },
  { value: 'Other', label: 'Other' }
];

const researcherTypes = [
  { key: 'academic', title: 'Academic', icon: GraduationCap, fg: 'text-primary', bg: 'bg-light-blue', ring: 'ring-primary' },
  { key: 'corporate', title: 'Corporate / NGO', icon: Building2, fg: 'text-accent-indigo', bg: 'bg-light-purple', ring: 'ring-accent-indigo' },
  { key: 'medical', title: 'Medical', icon: HeartPulse, fg: 'text-accent-green', bg: 'bg-light-green', ring: 'ring-accent-green' },
  { key: 'non_researcher', title: 'Not a Researcher', icon: UserCheck, fg: 'text-accent-orange', bg: 'bg-light-orange', ring: 'ring-accent-orange' }
];

const getPasswordStrength = (value = '') => {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 6) score++;
  if (value.length >= 10) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
  return score;
};

const strengthMeta = [
  { label: '', color: 'bg-border' },
  { label: 'Weak', color: 'bg-accent-red' },
  { label: 'Fair', color: 'bg-accent-orange' },
  { label: 'Good', color: 'bg-primary' },
  { label: 'Strong', color: 'bg-accent-green' }
];

const affiliationFields = {
  academic: [
    { name: 'institution', label: 'University / Institution', placeholder: 'e.g. Stanford University', required: true },
    { name: 'department', label: 'Department', placeholder: 'e.g. Computer Science', required: true },
    { name: 'designation', label: 'Designation (Optional)', placeholder: 'e.g. Associate Professor', required: false }
  ],
  corporate: [
    { name: 'company', label: 'Company / Organisation', placeholder: 'e.g. Google DeepMind', required: true },
    { name: 'division', label: 'Division / Department', placeholder: 'e.g. AI Research Group', required: true },
    { name: 'position', label: 'Position / Role', placeholder: 'e.g. Principal Scientist', required: true }
  ],
  medical: [
    { name: 'hospital', label: 'Hospital / Medical Institute', placeholder: 'e.g. Mayo Clinic', required: true },
    { name: 'department', label: 'Department', placeholder: 'e.g. Cardiology', required: true },
    { name: 'designation', label: 'Designation / Rank', placeholder: 'e.g. Resident Physician', required: true }
  ],
  non_researcher: [
    { name: 'organization', label: 'Organisation / Agency', placeholder: 'e.g. Nature Publishing Group', required: true },
    { name: 'occupation', label: 'Occupation', placeholder: 'e.g. Scientific Editor', required: true },
    { name: 'interest', label: 'Research Interest', placeholder: 'e.g. Quantum Computing', required: true }
  ]
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    getValues,
    formState: { errors }
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      researcherType: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      country: '',
      phone: '',
      acceptAll: false,
      institution: '', department: '', designation: '',
      company: '', division: '', position: '',
      hospital: '',
      organization: '', occupation: '', interest: ''
    }
  });

  const researcherType = watch('researcherType');
  const passwordValue = watch('password');
  const strength = getPasswordStrength(passwordValue);

  const handleSelectType = (key) => {
    setValue('researcherType', key, { shouldValidate: true });
    if (errors.researcherType) trigger('researcherType');
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { acceptAll, ...rest } = data;
      const payload = { ...rest, acceptTerms: acceptAll, acceptPrivacy: acceptAll };
      const response = await authService.register(payload);
      if (response.success) {
        toast.success('Registration pending. Verify the OTP code sent to your email.');
        dispatch(setOtpEmail(data.email));
        dispatch(setOtpPurpose('registration'));
        navigate('/otp');
      }
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="glass-card rounded-2xl p-4 sm:p-6 shadow-xl border border-border bg-white bg-opacity-70 backdrop-blur-md">
        <div className="flex flex-col items-center mb-4">
          <Link to="/" className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-gradient-primary text-white flex items-center justify-center shadow-sm">
              <Share2 className="w-4 h-4" />
            </span>
            <span className="font-bold text-lg tracking-tight text-text-primary">
              Research<span className="text-primary">Connect</span>
            </span>
          </Link>
          <h2 className="text-lg font-bold text-text-primary tracking-tight text-center">Create Researcher Account</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Profile type — single click, no page change */}
          <div>
            <label className="text-xs font-semibold text-text-secondary tracking-wide flex items-center gap-1 mb-2">
              I am a <span className="text-accent-red font-bold">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {researcherTypes.map(({ key, title, icon: Icon, fg, bg, ring }) => {
                const selected = researcherType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectType(key)}
                    className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-center transition-all duration-150 ${
                      selected ? `border-transparent ring-2 ${ring} ${bg}` : 'border-border bg-white bg-opacity-50 hover:border-primary'
                    }`}
                  >
                    <span className={`p-1.5 rounded-lg ${bg} ${fg}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-bold text-text-primary leading-tight">{title}</span>
                  </button>
                );
              })}
            </div>
            <input type="hidden" {...register('researcherType', { required: 'Please select a profile type' })} />
            {errors.researcherType && (
              <span className="text-xs font-medium text-accent-red">{errors.researcherType.message}</span>
            )}
          </div>

          {/* Affiliation — appears the moment a type is picked */}
          <AnimatePresence initial={false}>
            {researcherType && (
              <motion.div
                key={researcherType}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="space-y-2.5 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {affiliationFields[researcherType].slice(0, 2).map((f) => (
                      <Input
                        key={f.name}
                        label={f.label}
                        placeholder={f.placeholder}
                        error={errors[f.name]?.message}
                        autoComplete="organization"
                        required={f.required}
                        {...register(f.name, f.required ? { required: `${f.label.replace(' (Optional)', '')} is required` } : {})}
                      />
                    ))}
                  </div>
                  {affiliationFields[researcherType].slice(2).map((f) => (
                    <Input
                      key={f.name}
                      label={f.label}
                      placeholder={f.placeholder}
                      error={errors[f.name]?.message}
                      required={f.required}
                      {...register(f.name, f.required ? { required: `${f.label} is required` } : {})}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              placeholder="Alice"
              error={errors.firstName?.message}
              autoComplete="given-name"
              required
              {...register('firstName', { required: 'First name is required' })}
            />
            <Input
              label="Last Name"
              placeholder="Smith"
              error={errors.lastName?.message}
              autoComplete="family-name"
              required
              {...register('lastName', { required: 'Last name is required' })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Country"
              placeholder="Select Country"
              options={countriesList}
              error={errors.country?.message}
              required
              {...register('country', { required: 'Country is required' })}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="alice@university.edu"
              error={errors.email?.message}
              autoComplete="email"
              inputMode="email"
              required
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                  message: 'Invalid email address format'
                }
              })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <div className="flex flex-col w-full space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary tracking-wide flex items-center gap-1">
                Password <span className="text-accent-red font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full px-4 py-2 pr-10 text-sm bg-bg-card border ${
                    errors.password ? 'border-accent-red focus:ring-accent-red' : 'border-border focus:ring-primary'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-40 transition-colors`}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' }
                  })}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password?.message ? (
                <span className="text-xs font-medium text-accent-red">{errors.password.message}</span>
              ) : passwordValue ? (
                <div className="flex items-center gap-2 pt-0.5">
                  <div className="flex gap-1 flex-grow">
                    {[1, 2, 3, 4].map((i) => (
                      <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${strength >= i ? strengthMeta[strength].color : 'bg-border'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] font-semibold text-text-secondary whitespace-nowrap">{strengthMeta[strength].label}</span>
                </div>
              ) : (
                <span className="text-[11px] text-text-secondary">Minimum 6 characters</span>
              )}
            </div>

            <div className="flex flex-col w-full space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary tracking-wide flex items-center gap-1">
                Confirm Password <span className="text-accent-red font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full px-4 py-2 pr-10 text-sm bg-bg-card border ${
                    errors.confirmPassword ? 'border-accent-red focus:ring-accent-red' : 'border-border focus:ring-primary'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-40 transition-colors`}
                  {...register('confirmPassword', {
                    required: 'Confirm password is required',
                    validate: (value) => value === getValues('password') || 'Passwords do not match'
                  })}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword?.message && (
                <span className="text-xs font-medium text-accent-red">{errors.confirmPassword.message}</span>
              )}
            </div>
          </div>

          <Checkbox
            label="I accept the Terms of Service & Privacy Policy"
            error={errors.acceptAll?.message}
            required
            {...register('acceptAll', { required: 'You must accept the terms to continue' })}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full flex items-center justify-center gap-2 shadow-md"
            loading={loading}
            icon={<CheckCircle2 className="w-4 h-4" />}
          >
            Create Account
          </Button>
        </form>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-text-secondary">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-primary hover:text-primary-hover transition-colors">
            Sign In Here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;